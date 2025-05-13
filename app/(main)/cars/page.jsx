import { getCarfilters } from '@/actions/car-listing'
import React from 'react'
import CarFilters from './_components/car-filters';
import CarListing from './_components/car-listing';

export const metaData = {
    title:"Cars | Vehiql",
    description: "Browse and search for your dream car"
}

const CarPage = async () => {
    const filterData = await getCarfilters();
    
    
  return (
    <div className='container mx-auto px-4 py-12'>
        <h1 className='text-6xl mb-4 gradient-title'>Browse Car</h1>
        <div className='flex flex-col lg:flex-row gap-8'>
            <div className='w-full lg:w-80 flex-shrink-0'>
                <CarFilters filters={filterData.data}/>
            </div>
            
            
            
            
            <div className='flex-1'>
                <CarListing/>
            </div>
        </div>
    </div>
  )
}

export default CarPage