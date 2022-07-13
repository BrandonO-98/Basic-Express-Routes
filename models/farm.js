const mongoose = require('mongoose')
const Product = require('./product')
const { Schema } = mongoose

const farmSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Farm must have a name property']
  },
  city: {
    type: String
  },
  email: {
    type: String,
    required: [true, 'Email required']
  }, 
  products : [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }]
}) 

// use a regular function as in docs since an arrow function has 
//a different this binding
farmSchema.post('findOneAndDelete', async function(farm) {
  if (farm.products.length) {
    // delete all products if they have an id contined in farm.products
    const res = await Product.deleteMany({ _id: { $in: farm.products } })
    console.log(res)
  }
})

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;