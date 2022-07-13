const mongoose = require('mongoose')
const Product = require('./models/product')

// seed data for development purposes
mongoose.connect('mongodb://localhost:27017/farmStand')
.then(()=> {
  console.log("Mongo Connection Open!")
})
.catch(err => {
  console.log("Mongo Error!")
  console.log(err)
})


const seedProducts = [
  {
    name: 'Fairy Eggplant',
    price: 1.00, 
    category: 'vegetable'
  },
  {
    name: 'Organic Goddess Melon',
    price: 4.99, 
    category: 'fruit'
  },
  {
    name: 'Watermelon',
    price: 4.99, 
    category: 'fruit'
  },
  {
    name: 'Celery',
    price: 1.50, 
    category: 'vegetable'
  },
  {
    name: 'Chocolate Milk',
    price: 2.69, 
    category: 'dairy'
  }
]

Product.deleteMany({}).then(msg => console.log(msg))
Product.insertMany(seedProducts).
then(data => {
  console.log(data)
})
.catch(e=> {
  console.log(e)
})