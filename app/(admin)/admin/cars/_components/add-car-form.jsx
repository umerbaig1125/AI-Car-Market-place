"use client";

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Camera, Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { addCar, processCarImageWithAI } from '@/actions/cars';
import { useRouter } from 'next/navigation';

const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-In Hybrid'];
const transmissions = ['Automatic', 'Manual', 'Semi-Automatic'];
const bodyTypes = ['SUV', 'Sedan', 'Hatchback', 'Convertable', 'Coupe', 'Wagon', 'Pickup'];
const carStatuses = ['AVAILABLE', 'UNAVAILABLE', 'SOLD'];

const AddCarForm = () => {

  const [activeTab, setActiveTab] = useState('ai')
  const [uploadedImages, setUploadedImages] = useState([])
  const [imageError, setImageError] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadedAIImage, setUploadedAIImage] = useState(null)
  const router = useRouter();
  const carFormSchema = z.object({
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.string().refine((val) => {
      const year = parseInt(val);
      return (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1);
    }, 'Valid year required'),
    make: z.string().min(1, 'Make is required'),
    price: z.string().min(1, 'price is required'),
    mileage: z.string().min(1, 'Mileage is required'),
    color: z.string().min(1, 'Color is required'),
    fuelType: z.string().min(1, 'Fuel type is required'),
    transmission: z.string().min(1, 'Transmission is required'),
    bodyType: z.string().min(1, 'Body type is required'),
    seats: z.string().optional(),
    description: z.string().min(10, 'Description must be atleast 10 characters'),
    status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'SOLD']),
    featured: z.boolean().default(false),
  })

  const { register, setValue, getValues, formState: { errors }, handleSubmit, watch } = useForm({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      make: "",
      price: "",
      mileage: "",
      color: "",
      fuelType: "",
      transmission: "",
      bodyType: "",
      seats: "",
      description: "",
      status: "AVAILABLE",
      featured: false,
    }
  });

  const onAIDrop = (acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB.');
        return;
      }
      setUploadedAIImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        toast.success('Image uploaded successfully');
      };

      reader.readAsDataURL(file);
    }
  })

  const { getRootProps: getAIRootProps, getInputProps: getAItInputProps } = useDropzone({
    onDrop: onAIDrop, accept: {
      "image/*": ["/jpeg", ".jpg", ".png", ".webp"],

    }, maxFiles: 1, multiple: false
  })

  const { data: processImageResult, loading: processImageLoading, fn: processImageFn, error: processImageError } = useFetch(processCarImageWithAI)

  const processImageWithAI = async () => {
    if (!uploadedAIImage) {
      toast.error('Please upload an image first');
      return;
    }
    await processImageFn(uploadedAIImage)
  }

  useEffect(() => {
    if (processImageError) {
      toast.error('Failed to upload car');
    }
  }, [processImageError]);
  useEffect(() => {
    if (processImageResult?.success) {
      const carDetails = processImageResult.data;
      setValue("make", carDetails.make);
      setValue("model", carDetails.model);
      setValue("year", carDetails.year.toString());
      setValue("color", carDetails.color);
      setValue("bodyType", carDetails.bodyType);
      setValue("fuelType", carDetails.fuelType);
      setValue("price", carDetails.price.replace(/[^0-9.-]+/g, ""));  // Remove non-numeric characters
      setValue("mileage", carDetails.mileage.replace(/[^0-9.-]+/g, ""));  // If mileage has a similar format
      setValue("transmission", carDetails.transmission);
      setValue("description", carDetails.description);


      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages((prev) => [...prev, e.target.result])
      }
      reader.readAsDataURL(uploadedAIImage);

      toast.success('Successfully extracted car details', {
        description: `Detected ${carDetails.year} ${carDetails.make} ${carDetails.model} with ${Math.round(carDetails.confidence * 100)}% confidence`
      });
      setActiveTab('manual')
    }
  }, [processImageResult, uploadedAIImage]);

  const { data: addCarDataResult, loading: addCarLoading, fn: addCarFn } = useFetch(addCar)
  useEffect(() => {
    if (addCarDataResult?.success) {
      toast.success('Car added successfully');
      router.push('/admin/cars');
    }
  }, [addCarDataResult])
  const onSubmit = async (data) => {
    if (uploadedImages.length === 0) {
      setImageError('Please upload at least one image');
      return;
    }

    const carData = {
      ...data,
      year: parseInt(data.year),
      price: parseInt(data.price),
      mileage: parseInt(data.mileage),
      seats: data.seats ? parseInt(data.seats) : null,
    };

    await addCarFn({
      carData,
      images: uploadedImages
    })
  };

  const onMultiImageDrop = (acceptedFiles) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit and will be skipped`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;

    const newImages = [];
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push(e.target.result);
        if (newImages.length === validFiles.length) {
          setUploadedImages((prev) => [...prev, ...newImages])
          setImageError("");
          toast.success(`Successfully uploaded ${validFiles.length} images`);
        }
      };
      reader.readAsDataURL(file);
    })
  };
  const { getRootProps: getMultiImageRootProps, getInputProps: geMultiImagetInputProps } = useDropzone({
    onDrop: onMultiImageDrop, accept: {
      "image/*": ["/jpeg", ".jpg", ".png", ".webp"],

    }, multiple: true
  })

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  }
  return (
    <div>
      <Tabs defaultValue="ai" className="mt-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="ai">AI Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>Car Details</CardTitle>
              <CardDescription>Enter the details of the car you want to add.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='make'>Make</Label>
                    <Input id='make' {...register("make")}
                      placeholder='e.g. Toyota'
                      className={errors.make ? 'border-red-500' : ''}
                    />
                    {errors.make && (
                      <p className='text-xs text-red-500'>{errors.make.message}</p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='model'>Model</Label>
                    <Input id='model' {...register("model")}
                      placeholder='e.g. Corolla'
                      className={errors.model ? 'border-red-500' : ''}
                    />
                    {errors.model && (
                      <p className='text-xs text-red-500'>{errors.model.message}</p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='year'>Year</Label>
                    <Input id='year' {...register("year")}
                      placeholder='e.g. 2024'
                      className={errors.year ? 'border-red-500' : ''}
                    />
                    {errors.year && (
                      <p className='text-xs text-red-500'>
                        {errors.year.message}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='price'>Price</Label>
                    <Input id='price' {...register("price")}
                      placeholder='e.g. 2500000'
                      className={errors.price ? 'border-red-500' : ''}
                    />
                    {errors.price && (
                      <p className='text-xs text-red-500'>
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='mileage'>Mileage</Label>
                    <Input id='mileage' {...register("mileage")}
                      placeholder='e.g. 15000'
                      className={errors.mileage ? 'border-red-500' : ''}
                    />
                    {errors.mileage && (
                      <p className='text-xs text-red-500'>
                        {errors.mileage.message}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='color'>Color</Label>
                    <Input id='color' {...register("color")}
                      placeholder='e.g. Black'
                      className={errors.color ? 'border-red-500' : ''}
                    />
                    {errors.color && (
                      <p className='text-xs text-red-500'>
                        {errors.color.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='fuelType'>Fuel Type</Label>
                    <Select onValueChange={value => setValue("fuelType", value)}
                      defaultValue={getValues("fuelType")}>
                      <SelectTrigger className={`w-full ${errors.fuelType ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Fuel Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypes.map((ft) => {
                          return <SelectItem key={ft} value={ft}>{ft}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>

                    {errors.fuelType && (
                      <p className='text-xs text-red-500'>
                        {errors.fuelType.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='transmission'>Transmission</Label>
                    <Select onValueChange={value => setValue("transmission", value)}
                      defaultValue={getValues("transmission")}>
                      <SelectTrigger className={`w-full ${errors.transmission ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        {transmissions.map((ft) => {
                          return <SelectItem key={ft} value={ft}>{ft}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>

                    {errors.transmission && (
                      <p className='text-xs text-red-500'>
                        {errors.transmission.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bodyType'>Body Type</Label>
                    <Select onValueChange={value => setValue("bodyType", value)}
                      defaultValue={getValues("bodyType")}>
                      <SelectTrigger className={`w-full ${errors.bodyType ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Body Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bodyTypes.map((ft) => {
                          return <SelectItem key={ft} value={ft}>{ft}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>

                    {errors.bodyType && (
                      <p className='text-xs text-red-500'>
                        {errors.bodyType.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='seats'>Number of Seats{' '}
                      <span className='text-xs text-gray-500'>(Optional)</span>
                    </Label>
                    <Input id='seats' {...register("seats")}
                      placeholder='e.g. 5'
                      className={errors.seats ? 'border-red-500' : ''}
                    />
                    {errors.seats && (
                      <p className='text-xs text-red-500'>
                        {errors.seats.message}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='status'>Status</Label>
                    <Select onValueChange={value => setValue("status", value)}
                      defaultValue={getValues("status")}>
                      <SelectTrigger className={`w-full ${errors.status ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {carStatuses.map((ft) => {
                          return <SelectItem key={ft} value={ft}>{ft.charAt(0) + ft.slice(1).toLowerCase()}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>

                    {errors.status && (
                      <p className='text-xs text-red-500'>
                        {errors.status.message}
                      </p>
                    )}
                  </div>


                </div>
                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea id='description' {...register("description")}
                    placeholder='Enter detailed description of the car...'
                    className={`min-h-32 ${errors.description ? 'border-red-500' : ''}`}
                  />
                  {errors.description && (
                    <p className='text-xs text-red-500'>
                      {errors.description.message}
                    </p>
                  )}
                </div>
                <div className='flex items-start space-x-3 space-y-0 rounded-md border p-4'>
                  <Checkbox checked={watch('featured')} id='featured'
                    onCheckedChange={(checked) => setValue('featured', checked)}
                  />
                  <div className='space-y-1 leading-none'>
                    <Label htmlFor='featured'>Feature this Car</Label>
                    <p className='text-sm text-gray-500'>
                      Featured cars appear on the homepage
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor='images'
                    className={imageError ? 'text-red-500' : ''}
                  >Images{' '}
                    {imageError && <span className='text-red-500'>*</span>}
                  </Label>
                  <div {...getMultiImageRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition mt-2 ${imageError ? 'border-red-500' : 'border-gray-300'}`}>
                    <input {...geMultiImagetInputProps()} />
                    <div className='flex flex-col items-center justify-center'>
                      <Upload className='h-12 w-12 text-gray-400 mb-3' />
                      <p className='text-sm text-gray-600'>
                        Drag & drop or click to upload multiple images
                      </p>
                      <p className='text-gray-500 text-xs mt-1'>
                        Supports: JPG, PNG, WebP (max 5MB each)
                      </p>
                    </div>
                  </div>
                  {imageError && (
                    <p className='text-xs text-red-500 mt-3'>{imageError}</p>
                  )}
                  {uploadedImages.length > 0 && (
                    <div className='mt-4'>
                      <h3 className='text-sm font-medium mb-2'>Uploaded Images ({uploadedImages.length})</h3>
                      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                        {uploadedImages.map((image, index) => {
                          return <div key={index} className='relative group'>
                            <Image
                              src={image}
                              alt={`cCar Image $${index + 1}`}
                              height={50}
                              width={50}
                              className='h-28 w-full object-cover rounded-md'
                              priority
                            />
                            <Button
                              type='button'
                              size='icon'
                              variant='destructive'
                              className='absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                              onClick={() => removeImage(index)}
                            >
                              <X className='h-3 w-3' />
                            </Button>
                          </div>
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <Button type='submit' className='w-full md:w-auto' disabled={addCarLoading} >
                  {addCarLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Adding Car...
                    </>
                  ) : (
                    'Add Car'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

        </TabsContent>
        <TabsContent value="ai" className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Car Detail Extraction</CardTitle>
              <CardDescription>
                Upload an image of a car and let AI extract its details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='border-3 border-dashed rounded-lg p-6 text-center'>
                  {imagePreview ?
                    (
                      <div className='flex flex-col items-center'>
                        <img src={imagePreview} alt='Car Preview' className='max-h-56 max-w-full object-contain mb-4' />
                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setImagePreview(null);
                              setUploadedAIImage(null);
                            }}
                          >
                            Remove
                          </Button>
                          <Button
                            size='sm'
                            onClick={processImageWithAI}
                            disabled={processImageLoading}
                          >
                            {processImageLoading ?
                              (<>
                                <Loader2 className='mr-2 h-1 w-4 animate-spin' />
                                Processing...
                              </>) : (
                                <>
                                  <Camera className='mr-2 h-1 w-4' />
                                  Extract Details
                                </>
                              )

                            }
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div {...getAIRootProps()}
                        className='cursor-pointer hover:bg-gray-50 transition'
                      >
                        <input {...getAItInputProps()} />
                        <div className='flex flex-col items-center justify-center'>
                          <Camera className='h-12 w-12 text-gray-400 mb-2' />
                          <p className='text-gray-600 text-sm'>
                            Drag & drop or click to uplaod car image
                          </p>
                          <p className='text-gray-500 text-xs mt-1'>
                            Supports: JPG, PNG, WebP (max 5MB)
                          </p>
                        </div>
                      </div>
                    )
                  }
                </div>
                <div className='bg-gray-50 p-4 rounded-md'>
                  <h3 className='font-medium mb-2'>How it works</h3>
                  <ol className='space-y-2 text-sm text-gray-600 list-decimal pl-6'>
                    <li>Uplaod a clear image of the car</li>
                    <li>Click "Extract Details" to analyze with AI</li>
                    <li>Review the extracted information</li>
                    <li>Fill in any missing details manually</li>
                    <li>Add the car to your inventory</li>
                  </ol>
                </div>
                <div className='bg-amber-50 p-4 rounded-md'>
                  <h3 className='font-medium text-amber-800 mb-1'>Tips for best results</h3>
                  <ul className='space-y-1 text-sm text-amber-700'>
                    <li>● Use clear, well-lit image</li>
                    <li>● Try to capture the entire vehicle</li>
                    <li>● For difficult models, use multiple views</li>
                    <li>● Always verify AI-extracted information</li>
                  </ul>
                </div>

              </div>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>

    </div>
  )
}

export default AddCarForm