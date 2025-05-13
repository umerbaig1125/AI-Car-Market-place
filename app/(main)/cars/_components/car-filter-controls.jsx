"use client"

import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Check, X } from 'lucide-react';
import React from 'react'

const CarFilterControls = ({
    filters,
    currentFilters,
    onFilterChange,
    onClearFilter,
}) => {
    const { make, bodyType, fuelType, transmission, priceRange } = currentFilters;


    const filterSections = [
        {
            id: "make",
            title: "Make",
            options: filters.makes.map((make) => ({ value: make, label: make })),
            currentValue: make,
            onChange: (value) => onFilterChange("make", value),
        },
        {
            id: "bodyType",
            title: "Body Type",
            options: filters.bodyTypes.map((bodyType) => ({ value: bodyType, label: bodyType })),
            currentValue: bodyType,
            onChange: (value) => onFilterChange("bodyType", value),
        }, {
            id: "fuelType",
            title: "Fuel Type",
            options: filters.fuelTypes.map((fuelType) => ({ value: fuelType, label: fuelType })),
            currentValue: fuelType,
            onChange: (value) => onFilterChange("fuelType", value),
        }, {
            id: "transmission",
            title: "Transmission",
            options: filters.transmissions.map((transmission) => ({ value: transmission, label: transmission })),
            currentValue: transmission,
            onChange: (value) => onFilterChange("transmission", value),
        },
    ];

    return (
        <div className='space-y-6'>
            <div className='space-y-4'>
                <h3 className='font-medium'>Price Range</h3>
                <div className='px-2'>
                    <Slider value={priceRange} onValueChange={(value) => onFilterChange("priceRange", value)} max={filters.priceRange.max} min={filters.priceRange.min} step={100} />
                </div>
                <div className='flex items-center justify-between'>
                    <div className='font-medium text-sm'>$ {priceRange[0]}</div>
                    <div className='font-medium text-sm'>$ {priceRange[1]}</div>
                </div>
            </div>
            {filterSections.map((section) => (
                <div key={section.id} className='space-y-3'>
                    <h4 className='text-sm font-medium flex justify-between'>
                        <span>{section.title}</span>
                        {section.currentValue && (
                            <button className='text-xs text-gray-600 flex items-center cursor-pointer'
                                onClick={() => onClearFilter(section.id)}>
                                <X className='mr-1 h-3 w-3' />
                                Clear
                            </button>
                        )}
                    </h4>
                    <div className='flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1'>
                        {section.options.map((opt)=>(
                            <Badge key={opt.value}
                            variant={section.currentValue === opt.value ?"default":"outline"}
                            className={`cursor-pointer px-3 py-1 
                                ${section.currentValue === opt.value ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200':
                                    'bg-white hover:bg-gray-100 text-gray-700'
                                }`}
                                onClick={()=>{
                                    section.onChange(
                                        section.currentValue === opt.value ? "" : opt.value
                                    )
                                }}
                            >{opt.label} 
                            {section.currentValue === opt.value && (
                                <Check className='ml-1 h-3 w-3 inline'/>
                            )}
                            </Badge>
                        ))}
                </div>
                </div>
            ))}
        </div>
    )
}

export default CarFilterControls