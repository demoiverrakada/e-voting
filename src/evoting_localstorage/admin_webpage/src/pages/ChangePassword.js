import React ,{ useEffect }from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import './ChangePassword.css';
import { useNavigate } from 'react-router-dom';
import Navigation from '../Navigation';
import Loading from './Loading';

function ChangePasswordPage() {
const navigate = useNavigate();
useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/');
    }
  }, [navigate]);

  const formik = useFormik({
    initialValues: {
      email: '',
      oldPassword: '',
      newPassword: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      oldPassword: Yup.string().required('Required'),
      newPassword: Yup.string().min(6, 'Must be at least 6 characters').required('Required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const token = sessionStorage.getItem('access_token');
        const response = await axios.post('/api/update-password', values, {
        headers:{
        authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        },
        });
        alert(response.data.message);
        resetForm();
      } catch (error) {
        const msg =
          error?.response?.data?.error || 'Password update failed. Please try again.';
        alert(msg);
      }
    },
  });

  return (
    <div className="password-change-container">
      <h1>Change Admin Password</h1>
      <form onSubmit={formik.handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
        />
        {formik.errors.email && <p>{formik.errors.email}</p>}

        <input
          type="password"
          name="oldPassword"
          placeholder="Old Password"
          value={formik.values.oldPassword}
          onChange={formik.handleChange}
        />
        {formik.errors.oldPassword && <p>{formik.errors.oldPassword}</p>}

        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          value={formik.values.newPassword}
          onChange={formik.handleChange}
        />
        {formik.errors.newPassword && <p>{formik.errors.newPassword}</p>}

        <button type="submit">Update Password</button>
      </form>
      <Navigation />
    </div>
  );
}

export default ChangePasswordPage;

