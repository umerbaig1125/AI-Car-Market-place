export const formatCurrency = (amount)=>{
    return new Intl.NumberFormat('en-US',{
        style:'currency',
        currency:'USD'
    }).format(amount);
};
export const serializedCarsData = (car, wishlisted = false)=>{
    return {
        ...car,
        price: car.price ? parseFloat(car.price.toString()) : 0,
        createdAt: car.createdAt.price?.toISOString(),
        updatedAt: car.updatedAt.price?.toISOString(),
        wishlisted: wishlisted.price?.toISOString(),
    }
}