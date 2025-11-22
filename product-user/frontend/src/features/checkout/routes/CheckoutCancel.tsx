import { Link } from "react-router-dom";

export default function CheckoutCancel() {
  return (
    <div className="container">
      <div className="mt-10 p-6 bg-white rounded-md drop-shadow-custom text-center">
        <h1 className="text-2xl font-semibold mb-2">Đơn hàng vừa bị hủy</h1>
        <p className="text-secondary mb-6">
          Bạn đã hủy thanh toán trên Stripe. Giỏ hàng của bạn vẫn được giữ nguyên.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/cart" className="bg-primary text-white px-5 py-3 rounded-md font-semibold hover:bg-opacity-90">
            Quay lại giỏ hàng
          </Link>
          <Link to="/products/shop" className="text-primary font-semibold hover:underline">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
