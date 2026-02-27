import { Role, Specialty } from "../../../generated/prisma/client";
import { envVars } from "../../config/env";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { ICreateDoctorPayload } from "./doctor.interface";

const createDoctor = async (payload: ICreateDoctorPayload) => {
    const specities: Specialty[] = [];
    for (const specialtyId of payload.specialties) {
        const specialty = await prisma.specialty.findUnique({
            where: {
                id: specialtyId
            }
        });
        if (!specialty) {
            throw new Error(`Specialty with ID ${specialtyId} not found`);
        }
        specities.push(specialty);

        const userExists = await prisma.user.findUnique({
            where: {
                id: payload.doctor.email
            }
        });
        if (userExists) {
            throw new Error(`User with email ${payload.doctor.email} already exists`);
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
        try {
            const result = await prisma.$transaction(async (tx) => {
                const doctorData = await tx.doctor.create({
                    data: {
                        userId: userData.user.id,
                        ...payload.doctor,
                    }
                });

                const doctorSpecialtiesData = specities.map((specialty) => ({
                    doctorId: doctorData.id,
                    specialtyId: specialty.id
                }));

                await tx.doctorSpecialty.createMany({
                    data: doctorSpecialtiesData
                });

                const doctor = await tx.doctor.findUnique({
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
                                name: true
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

                return doctorData;
            });
        } catch (error) {
            if (envVars.NODE_ENV === 'development') {
                console.error('Error creating doctor:', error);
            }

            await prisma.user.delete({
                where: {
                    id: userData.user.id
                }
            });
        }
    }

}
