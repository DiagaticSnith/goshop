import React from 'react'

const UserForm = () => {
  return (
    <form className="grid grid-cols-1 gap-4">
      <div>
        <label>Full name</label>
        <input className="border p-2 w-full" />
      </div>
      <div>
        <label>Email</label>
        <input className="border p-2 w-full" />
      </div>
      <button className="bg-primary text-white px-4 py-2 rounded">Save</button>
    </form>
  )
}

export default UserForm
