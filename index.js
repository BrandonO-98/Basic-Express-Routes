const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose')
const Product = require('./models/product')
const Farm = require('./models/farm')
const methodOverride = require('method-override')
const AppError = require('./AppError')
const Joi = require('joi')

mongoose.connect('mongodb://localhost:27017/farmStand')
.then(()=> {
  console.log("Mongo Connection Open!")
})
.catch(err => {
  console.log("Mongo Error!")
  console.log(err)
})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// parse incomming POST request
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

// async wrapper function
function wrapAsync(fn) {
  return function(req,res,next) {
    fn(req,res,next).catch(e => next(e))
  }
}

const categories = ['fruit', 'vegetable', 'dairy']

// Farms Section 
app.get('/farms', async (req,res, next)=> {
  const farms = await Farm.find({})
  res.render('farms/index', {farms})
})

app.get('/farms/new', (req,res)=> {
  res.render('farms/new')
})

app.get('/farms/:id', async (req,res, next)=> {
  const {id} = req.params
  const farm = await Farm.findById(id).populate('products')
  res.render('farms/show', {farm})
})

app.post('/farms', async (req,res,next)=> {
  const newFarm = new Farm(req.body)
  await newFarm.save()
  res.redirect('/farms')
})

app.get('/farms/:id/products/new', async(req, res) => {
  const {id} = req.params
  const farm = await Farm.findById(id)
  res.render('products/new', {categories,farm})
})

app.post('/farms/:id/products/', async (req, res) => {
  const {id} = req.params
  const farm = await Farm.findById(id)
  const {name, price, category} = req.body
  const product = new Product({name, price, category})
  farm.products.push(product)
  product.farm = farm
  await farm.save()
  await product.save()
  res.redirect(`/farms/${id}`)
}) 

app.delete('/farms/:id', async (req,res)=> {
  const farm = await Farm.findByIdAndDelete(req.params.id)
  res.redirect('/farms')
})


// Products Section
// Joi validation for products
validateProduct = (req, res, next) => {
  const productValidationSchema = Joi.object({
    name: Joi.string().required(), 
    price: Joi.number().required().min(0), 
    // valid is like enum
    category: Joi.string().required().valid('fruit', 'vegetable', 'dairy')
  })
  const { error } = productValidationSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(ele => ele.message).join(',')
    console.log(msg)
    throw new AppError(msg, 400)
  }
  else next()
}

// catch error in mongoose code with wrapper function
app.get('/products', wrapAsync(async (req,res)=> {
  const {category} = req.query
  if (category) {
    const products = await Product.find({category})
    res.render('products/index', {products, category})
  } else {
    const products = await Product.find({})
    // category passed in is used as the page title
    res.render('products/index', {products, category: 'All'})
  }
}))

// Form for submitting new product
app.get('/products/new', (req,res)=> {
  res.render('products/new', {categories})
})

// non-async throw an error
app.get('/product/new', (req,res)=> {
  throw new AppError('Page Does Not Exist, try products/new', 404)
})

// catch error in mongoose code with try and catch
app.post('/products', validateProduct, async (req,res,next)=> {
  // create new instance of Product model
  try {  
    const newProduct = new Product(req.body)
    // console.log(newProduct)
    await newProduct.save()
    res.redirect('/products')}
    catch (e) {
      next(e)
    }
})

app.get('/products/:id', wrapAsync(async (req,res, next)=> {
  const {id} = req.params;
  const product = await Product.findById(id).populate('farm')
  // Inside an async function we use next in a wrapper to call our custom error handler
  //Without the thrown error, ejs is still rendered incompletely since product is null
  if (!product) {
    return next(new AppError('Product not found', 404)) 
  }
  // type error is thrown in the ejs file on rendering.
  res.render('products/show', {product})
}))

app.get('/products/:id/edit', wrapAsync(async (req,res)=> {
  const {id} = req.params;
  const product = await Product.findById(id)
  res.render('products/edit', {product, categories})
}))

app.put('/products/:id', validateProduct, wrapAsync(async (req,res,next)=> {
  const {id} = req.params;
  const product = await Product.findByIdAndUpdate(id, req.body, {runValidators: true, returnDocument:'after'})
  // redirects to a url, does not render a template
  res.redirect(`/products/${product._id}`)
}))

app.delete('/products/:id', wrapAsync(async (req,res)=> {
  const {id} = req.params;
  const product = await Product.findByIdAndDelete(id)
  res.redirect('/products')
}))

// Error handling is part of section 42 while the rest of the code is from section 38
//Custom mongoose error msg and status code
const handleValidationErr = err => {
  return new AppError(`Validation Failed...${err.message}`, 400)
}

app.use((err, req, res, next) => {
  // console.log(err.name)
  // if we get a mongoose validation error, run handleValidationErr and save to err
  //variable which will then be passed to next
  if (err.name === 'ValidationError') err = handleValidationErr(err)
  next(err)
})

app.use((err, req, res, next) => {
  const {status = 500, message = 'Something went wrong'} = err
  res.status(status).send(message)
})

app.listen(3000, () => {
  console.log('Listening on Port 3000')
})