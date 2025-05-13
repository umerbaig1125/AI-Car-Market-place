import { getCarById } from '@/actions/car-listing';
import React from 'react'
import CarDetails from './_components/car-details';

export async function generateMetaData({ params }) {
  const { id } = await params;
  const result = await getCarById(id);

  if (!result?.success) {
    return {
      title: 'Car Not Found | Vehiql',
      description: 'The required car could not be found',
    };
  }
  const car = result.data;

  return {
    title: `${car.year} ${car.make} ${car.model} | Vehiql`,
    description: car.description.subString(0, 100),
    openGraph: {
      images: car.image?.[0] ? [car.image[0]] : [],
    }
  }
}

const CarPage = async ({ params }) => {
  const { id } = await params;
  const result = await getCarById(id);
  if (!result?.success) {
    NotFound();
  }

  return (
    <div className='container mx-auto px-4 py-12'>
      <CarDetails car={result.data} testDriveInfo={result.data.testDriveInfo}/>
    </div>
  )
}

export default CarPage