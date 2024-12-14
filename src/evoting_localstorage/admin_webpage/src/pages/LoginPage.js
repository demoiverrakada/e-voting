import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';
function LoginPage() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      password: Yup.string().min(6, 'Must be at least 6 characters').required('Required'),
    }),
    onSubmit: async (values) => {
      try {
        const res = await axios.post('http://localhost:5000/signin/admin', values);
        sessionStorage.setItem('access_token', res.data.token);
        navigate('/options');
      } catch (err) {
        alert('Login failed. Please check your credentials.');
      }
    },
  });

  return (
    <div className="login-container">
      <h1>Admin Login</h1>
      <form onSubmit={formik.handleSubmit}>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
          />
          {formik.errors.email && <p>{formik.errors.email}</p>}
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
          />
          {formik.errors.password && <p>{formik.errors.password}</p>}
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
