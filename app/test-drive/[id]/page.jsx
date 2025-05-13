import { getCarById } from '@/actions/car-listing';
import { notFound } from 'next/navigation';
import React from 'react';
import { TestDriveForm } from './_components/test-drive-form';

export const metadata = {
  title: 'Book Test Drive | Vehiql',
  description: 'Schedule the test drive in seconds',
};

const TestDrivePage = ({ params }) => {
  return (
    <AsyncTestDrivePage params={params} />
  );
};

// Separate async function
const AsyncTestDrivePage = async (props) => {
  const params = await props.params;
  const { id } = params;

  const result = await getCarById(id);

  if (!result.success) notFound();

  return (
    <div className="container mx-auto px-6 py-12 mt-8">
      <h1 className="text-6xl mb-6 bg-gradient-title">Book a Test Drive</h1>
      <TestDriveForm car={result.data} testDriveInfo={result.data.testDriveInfo} />
    </div>
  );
};


export default TestDrivePage;
