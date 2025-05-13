"use server";

import { serializedCarsData } from "@/lib/helper";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function bookTestDrive({
    carId,
    bookingDate,
    startTime,
    endTime,
    notes
}){
    try {
        const { userId } = await auth();
        
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error('User not found!');
        
        const car = await db.cars.findUnique({
            where:{id:carId, status:"AVAILABLE"}
        });
        if(!car) throw new Error('Car not available for the drive');

        const existingBooking = await db.testDriveBooking.findFirst({
            where:{
                carId,
                bookingDate: new Date(bookingDate),
                startTime,
                endTime,
                status:{in:["PENDING", "CONFIRMED"]},
            },
        });

        if(existingBooking) {
            return{
                success:false,
                message:'Selected slot is already booked. please try anotehr slot.',
            }
        }

        const booking = await db.testDriveBooking.create({
            data:{
                carId,
                userId:user.id,
                bookingDate:new Date(bookingDate),
                startTime,
                endTime,
                notes:notes||null,
                status:"PENDING"
            },
        });

        revalidatePath(`/test-drive/${carId}`);
        revalidatePath(`/cars/${carId}`);

        return{
            success:true,
            data:booking,
        }
    } catch (error) {
        console.error('Error booking test drive', error);
        return{
            success:false,
            error:error.message || 'Failed to book text drive'
        }
    }
}

export async function getUserTestDrive(){
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error('User not found!');
        
        const bookings = await db.testDriveBooking.findMany({
            where:{userId:user.id},
            include:{car:true},
            orderBy:{bookingDate:'desc'},
        });

        const formatBookings = bookings.map((booking)=>({
            id:booking.id,
            carId:booking.carId,
            car:serializedCarsData(booking.car),
            bookingDate:booking.bookingDate.toISOString(),
            startTime:booking.startTime,
            endTime:booking.endTime,
            status:booking.status,
            notes:booking.notes,
            createdAt:booking.createdAt.toISOString(),
            updatedAt:booking.updatedAt.toISOString(),
        }))
        return{
            success:true,
            data:formatBookings,
        }
    } catch (error) {
        console.error('Error fetching test drive', error);
        return{
            success:false,
            error:error.message,
        }
    }
}

export async function cancelTestDrive(bookingId){
    try {
        const { userId } = await auth();
        
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error('User not found!');
        
        const booking = await db.testDriveBooking.findUnique({
            where:{id:bookingId}
        });
        if(!booking)  return{
            success:false,
            error:'Booking not found',
        };
        
        if(booking.userId !== user.id && user.role !== "ADMIN")
            return{
                success:false,
                error:'Unauthorized to cancel this booking',
            };
        

        if(booking.status === "CANCELLED") return{
            success:false,
            error:'Booking is already cancelled',
        };

        if(booking.status === "COMPLETED") return{
            success:false,
            error:'Cannot cancel a ompleted booking',
        };
        await db.testDriveBooking.update({
            where:{id:bookingId},
            data:{status:"CANCELLED"}
        });
        revalidatePath(`/reservations`);
        revalidatePath(`/admin/test-drives`);
         return{
            success:true,
            message:'Test drive cancelled successfully.',
        };
        
    } catch (error) {
        console.error('Error cancelling test drive', error);
        return{
            success:false,
            error:error.message
        }
    }
}