import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { MaintenanceGate } from './components/MaintenanceGate'
import { ProtectedRoute } from './components/ProtectedRoute'
import { StoreLayout } from './layouts/StoreLayout'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { Home } from './pages/Home'
import { Shop } from './pages/Shop'
import { Search } from './pages/Search'
import { Categories } from './pages/Categories'
import { CategoryProducts } from './pages/CategoryProducts'
import { Offers } from './pages/Offers'
import { NewArrivals } from './pages/NewArrivals'
import { Brands } from './pages/Brands'
import { BrandProducts } from './pages/BrandProducts'
import { FlashSale } from './pages/FlashSale'
import { BestSellers } from './pages/BestSellers'
import { Trending } from './pages/Trending'
import { ProductDetails } from './pages/ProductDetails'
import { Cart } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { Orders } from './pages/Orders'
import { OrderDetails } from './pages/OrderDetails'
import { OrderSuccess } from './pages/OrderSuccess'
import { Admin } from './pages/Admin'
import { DevHealth } from './pages/DevHealth'
import { NotFound } from './pages/NotFound'
import { Maintenance } from './pages/Maintenance'

function MainApp() {
  return (
    <AuthProvider>
      <CartProvider>
      <BrowserRouter>
        <MaintenanceGate>
          <Routes>
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route element={<StoreLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/search" element={<Search />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:slug" element={<CategoryProducts />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/flash-sale" element={<FlashSale />} />
              <Route path="/best-sellers" element={<BestSellers />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/brands/:slug" element={<BrandProducts />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/products/:slug" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />
              <Route path="/orders/:orderId/success" element={<OrderSuccess />} />
              <Route path="/dev-health" element={<DevHealth />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </MaintenanceGate>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default MainApp
