import React from 'react'

export const OrderPreview = (props: any) => {
  return (
    <div className="border p-3 rounded mb-3">
      <div>Order #{props.id}</div>
      <div>Total: {props.total}</div>
      <div>Status: {props.status}</div>
    </div>
  )
}
