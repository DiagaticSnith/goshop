import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../app/api";
import { toast } from "react-toastify";

export const OrderPreview = (props: any) => {
  const [isShowInvoice, setIsShowInvoice] = useState<boolean>(false);
  const [status, setStatus] = useState<string>(props.status || "PENDING");
  const { token } = useAuth();
  const items = Array.isArray(props.items)
    ? props.items
    : (() => {
        try { return JSON.parse(props.items || "[]"); } catch { return []; }
      })();

  return (
    <>
      <div className="bg-white border border-gray-300 p-4 w-full drop-shadow-custom rounded-md flex flex-col xs:flex-row xs:justify-between xs:items-center mb-3">
        <div className="flex space-x-1 justify-between items-center w-full md:w-1/2 text-sm sm:text-base">
          <div>
            <p className="text-secondary">Order Id</p>
            <p className="font-semibold">#{props.id}</p>
          </div>
          <div>
            <p className="text-secondary">Date of placement</p>
            <p className="font-semibold">{new Date(props.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-secondary">Total</p>
            <p className="font-semibold">${props.amount?.toFixed ? props.amount.toFixed(2) : props.amount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 xs:mt-0 xs:ml-4 md:ml-0">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {status}
          </span>
          {status === 'PENDING' && (
            <>
              <button
                className="bg-green-600 text-white font-semibold text-xs px-3 py-2 rounded-md hover:bg-green-700"
                onClick={async () => {
                  try {
                    await api.post(`/orders/${props.id}/confirm`, undefined, { headers: { Authorization: `Bearer ${token}` } });
                    setStatus('CONFIRMED');
                    toast.success('Order confirmed');
                  } catch (e) {
                    toast.error('Unable to confirm order');
                  }
                }}
              >
                Confirm
              </button>
              <button
                className="bg-red-600 text-white font-semibold text-xs px-3 py-2 rounded-md hover:bg-red-700"
                onClick={async () => {
                  try {
                    await api.post(`/orders/${props.id}/reject`, undefined, { headers: { Authorization: `Bearer ${token}` } });
                    setStatus('REJECTED');
                    toast.success('Order rejected and refunded');
                  } catch (e) {
                    toast.error('Unable to reject order');
                  }
                }}
              >
                Reject
              </button>
            </>
          )}
          <button
            className="bg-primary text-white font-semibold text-xs px-6 py-3 rounded-md transition-opacity hover:bg-opacity-90"
            onClick={() => setIsShowInvoice((prev) => !prev)}
          >
            {isShowInvoice ? "Hide" : "View"} invoice
          </button>
        </div>
      </div>
      {isShowInvoice && (
        <div className="border-gray-200 border rounded-xl bg-white mb-8 animate-dropdown text-sm">
          <table className="min-w-full text-left">
            <thead className="font-medium border-b-gray-200 border-b">
              <tr className="text-secondary font-bold">
                <th scope="col" className="px-4 py-7">
                  Product
                </th>
                <th scope="col" className="px-4 py-7">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr
                  key={idx}
                  className="transition duration-300 ease-in-out hover:bg-neutral-100"
                >
                  <td className="flex items-center px-4 py-3">
                    <img
                      src={item.product?.image as string}
                      alt="Product image"
                      className="w-16 h-16 rounded-md object-cover mr-4"
                    />
                    <p className="font-bold">
                      <Link to={`/products/${item.product?.id}`}>
                        {item.product?.name}
                      </Link>
                    </p>
                  </td>
                  <td className="text-secondary px-4">
                    ${((item.product?.price || 0) * (item.quantity || item.totalQuantity || 1)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t-gray-200 border-t text-sm">
            <div className="text-secondary">Customer</div>
            <div className="font-semibold mb-2">{props.user?.fullName || props.user?.email || props.userId}</div>
            <div className="text-secondary">Shipping address</div>
            <div className="font-medium whitespace-pre-wrap">{props.address || "(no address)"}</div>
            {props.country && (
              <div className="text-secondary mt-1">
                Country: <span className="font-medium">{props.country}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
