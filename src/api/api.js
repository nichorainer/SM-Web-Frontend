import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
})

export const getProducts = () => api.get('/products')
export const createProduct = (data) => api.post('/products', data)

export const getOrders = () => api.get('/orders')
export const createOrder = (data) => api.post('/orders', data)

export const getUsers = () => api.get('/users')