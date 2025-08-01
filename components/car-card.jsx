"use client";

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from './ui/card'
import Image from 'next/image'
import { CarIcon, Heart, Loader2 } from 'lucide-react'
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';
import { toggleSavedCar } from '@/actions/car-listing';
import useFetch from '@/hooks/use-fetch';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

const CarCard  = ({car}) => {
    const [saved, setSaved] = useState(car.wishlisted);
    const router = useRouter();
    const {isSignedIn} = useAuth();
  const { data: toggleResult, isToggling, fn: toggleSaveCar, toggleError } = useFetch(toggleSavedCar)

  useEffect(() => {
    if(toggleResult?.success && toggleResult?.saved !== saved){
      setSaved(toggleResult.saved);
      toast.success(toggleResult.message);
    }
  }, [toggleResult, saved]);

  useEffect(() => {
    if(toggleError){
      toast.error('Failed to update favorites');
    }
  }, [toggleError]);
  
    const handleToggleSave = async(e)=>{
      e.preventDefault();
      if(!isSignedIn){
        toast.error('Please sign in to save cars');
        router.push('/sign-in');
        return;
      }
      if(isToggling) return;

      await toggleSaveCar(car.id);
    };
  return (
  <Card className='overflow-hidden hover:shadow-lg transition group py-0'>
    <div className='relative h-48'>
      {car.image && car.image.length > 0 ? (
        <div className='relative w-full h-full'>
            <Image 
              src={car.image[0]} 
              alt={`${car.make} ${car.model}`}
              fill 
              className='object-cover group-hover:scale-105 transition duration-300' 
            />
        </div>
      ) : (
        <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
            <CarIcon className='h-12 w-12 text-gray-400'/>
        </div>
      )}
      <Button 
        variant='ghost' 
        size='icon' 
        className={`absolute top-2 right-2 bg-white/90 rounded-full p-1.5 ${
          saved ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-gray-900'
        }`} 
        onClick={handleToggleSave}
      >
        {isToggling ? (
          <Loader2 className='h-4 w-4 animate-spin'/>
        ):(
        <Heart className={saved ? 'fill-current' : ''} size={20}/>
        )}
      </Button>
      </div>
      <CardContent className='p-4'>
        <div className='flex flex-col mb-2'>
            <h3 className='text-lg font-bold line-clamp-1'>
                {car.make} {car.model}
            </h3>
            <span className='text-xl font-bold text-blue-600'>
              ${car.price.toLocaleString()}
            </span>
        </div>
        <div className='text-gray-600 mb-2 flex items-center'>
            <span>{car.year}</span>
            <span className='mx-2'>•</span>
            <span>{car.transmission}</span>
            <span className='mx-2'>•</span>
            <span>{car.fuelType}</span>
        </div>
        <div className='flex flex-wrap gap-1 mb-4'>
            <Badge variant='outline' className='bg-gray-50'>
                {car.bodyType}
            </Badge>
            <Badge variant='outline' className='bg-gray-50'>
                {car.mileage.toLocaleString()} miles
            </Badge>
            <Badge variant='outline' className='bg-gray-50'>
                {car.color}
            </Badge>
        </div>
        <div className='flex justify-between'>
            <Button className='flex-1'
            onClick={()=>router.push(`/cars/${car.id}`)}>View car</Button>
        </div>
      </CardContent>
    
  </Card>
  )
}

export default CarCard
