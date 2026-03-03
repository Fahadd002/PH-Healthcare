import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";

interface IRegisterPatientPayload {
    name: string;
    email: string;
    password: string;
}

const registerPatient = async (payload: IRegisterPatientPayload) => {
    const { name, email, password } = payload;

    const data = await auth.api.signUpEmail({
        body: {
            name,
            email,
            password
        }
    })

    if (!data.user) {
        throw new AppError(status.NOT_FOUND, "User Not Found");
    }
    try {
        const patient = await prisma.$transaction(async (tx) => {

            const patientTx = await tx.patient.create({
                data: {
                    userId: data.user.id,
                    name: payload.name,
                    email: payload.email
                }
            })
            return patientTx;

        })


        const accessToken = tokenUtils.getAccessToken({
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });

        const refreshToken = tokenUtils.getRefreshToken({
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });

        return {
            ...data,
            patient,
            accessToken,
            refreshToken
        }
    }
    catch (error) {
        await prisma.user.delete({
            where: {
                id: data.user.id
            }
        })
        throw error;
    }

}

interface ILoginUserPayload {
    email: string;
    password: string;
}

const loginUser = async (payload: ILoginUserPayload) => {
    const { email, password } = payload;

    const data = await auth.api.signInEmail({
        body: {
            email,
            password,
        }
    })

    if (data.user.status === UserStatus.BLOCKED) {
        throw new AppError(status.FORBIDDEN, "User is blocked");
    }

    if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
        throw new AppError(status.NOT_FOUND, "User is deleted");
    }

    const accessToken = tokenUtils.getAccessToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        status: data.user.status,
        isDeleted: data.user.isDeleted,
        emailVerified: data.user.emailVerified,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        status: data.user.status,
        isDeleted: data.user.isDeleted,
        emailVerified: data.user.emailVerified,
    });

    return {
        ...data,
        accessToken,
        refreshToken,
    };

}

const getNewToken = async (refreshToken: string, sessionToken: string) => {
    const isSessionTokenExist = await prisma.session.findUnique({
        where: {
            token: sessionToken,
        },
        include: {
            user: true,
        }
    })

    if (!isSessionTokenExist) {
        throw new AppError(status.UNAUTHORIZED, "Invalid Session Token");
    }

    const verifiedRefershToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET)
    if (!verifiedRefershToken) {
        throw new AppError(status.UNAUTHORIZED, "Invalid Refresh Token");
    }

    const data = verifiedRefershToken.data as JwtPayload;
    const newAccessToken = tokenUtils.getAccessToken({
        userId: data.id,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
    });

    const newRefreshToken = tokenUtils.getRefreshToken({
        userId: data.id,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
    });

    const {token} = await prisma.session.update({
        where: {
            token: sessionToken,
        },
        data: {
            token: sessionToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000),
            updatedAt: new Date(),
        }
    });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionToken: token,
    }
}


const getMe = async (user: IRequestUser) => {
    const userExist = await prisma.user.findUnique({
        where: {
            id: user.userId,
        },
        include: {
            patient: {
                include: {
                    appointments: true,
                    prescriptions: true,
                    reviews: true,
                    medicalReports: true,
                    patientHealthData: true,
                }
            },
            doctor: {
                include: {
                    specialties: true,
                    appointments: true,
                    reviews: true,
                    prescriptions: true,
                }
            },
            admin: true,
        }
    });

    if (!userExist) {
        throw new AppError(status.NOT_FOUND, "User Not Found");
    }

    return userExist;
}

export const AuthService = {
    registerPatient,
    loginUser,
    getMe,
    getNewToken,
};