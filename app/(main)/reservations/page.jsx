import { getUserTestDrive } from '@/actions/test-drive';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react'
import ReservationList from './_components/reservations-list';

export const metadata = {
    title: 'My Reservations | Vehiql',
    description: 'Manage your test drive reservations',
};

const ReservationsPage = async () => {
    const { userId } = await auth()
    if (!userId) {
        redirect('/sign-in?redirect=/reservations');
    }

    const reservationsResult = await getUserTestDrive();


    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-6xl mb-6 bg-gradient-title">Your Reservations</h1>
            <ReservationList initialData={reservationsResult}/>
        </div>
    )
}

export default ReservationsPage