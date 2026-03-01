import status from "http-status";
import { Role, Specialty } from "../../../generated/prisma/client";
import { envVars } from "../../config/env";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { ICreateDoctorPayload } from "../doctor/doctor.interface";
import AppError from "../../errorHelpers/AppError";

const createDoctor = async (payload: ICreateDoctorPayload) => {
    const specialties: Specialty[] = [];
    for (const specialtyId of payload.specialties) {
        const specialty = await prisma.specialty.findUnique({
            where: {
                id: specialtyId
            }
        });
        if (!specialty) {
            throw new AppError(status.NOT_FOUND, `Specialty with ID ${specialtyId} not found`);
        }
        specialties.push(specialty);
    }

    // Check if user already exists in auth system
    const userExists = await prisma.user.findUnique({
        where: {
            email: payload.doctor.email  
        }
    });
    
    if (userExists) {
        throw new AppError(status.CONFLICT, `User with email ${payload.doctor.email} already exists`);
    }

    const userData = await auth.api.signUpEmail({
        body: {
            email: payload.doctor.email,
            password: payload.password,
            role: Role.DOCTOR,
            name: payload.doctor.name,
            needPasswordChange: true
        }
    });

    if (!userData.user) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create user in auth system");
    }

    try {
        // Create doctor and specialties in a transaction
        const doctor = await prisma.$transaction(async (tx) => {
            // Create doctor
            const doctorData = await tx.doctor.create({
                data: {
                    userId: userData.user.id,
                    ...payload.doctor,
                }
            });

            // Create doctor specialties
            const doctorSpecialtiesData = specialties.map((specialty) => ({
                doctorId: doctorData.id,
                specialtyId: specialty.id
            }));

            await tx.doctorSpecialty.createMany({
                data: doctorSpecialtiesData
            });

            // Return doctor with all relations
            return await tx.doctor.findUnique({
                where: {
                    id: doctorData.id
                },
                select: {
                    id: true,
                    userId: true,
                    name: true,
                    email: true,
                    contactNumber: true,
                    address: true,
                    profilePhoto: true,
                    experience: true,
                    gender: true,
                    appointmentFee: true,
                    designation: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            emailVerified: true,
                            image: true,
                            isDeleted: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    },
                    specialties: {
                        select: {
                            specialty: {
                                select: {
                                    id: true,
                                    title: true
                                }
                            }
                        }
                    }
                }
            });
        });

        return doctor;
        
    } catch (error) {
        // If transaction fails, clean up the created user
        if (envVars.NODE_ENV === 'development') {
            console.error('Error creating doctor:', error);
        }

        await prisma.user.delete({
            where: {
                id: userData.user.id
            }
        }).catch(console.error);
    }
};

export const doctorService = {
    createDoctor
};