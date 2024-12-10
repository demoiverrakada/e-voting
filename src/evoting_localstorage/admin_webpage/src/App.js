import React from 'react';
import { ReactSession } from 'react-client-session';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup'; 
import './App.css';

const initialValues = {
  Email: '',
  Password: '',
};

function App() {
  // Clear the session token when the login page is loaded
  ReactSession.setStoreType('sessionStorage');
  ReactSession.set('access_token', null);

  const navigate = useNavigate();

  const loginSchema = Yup.object().shape({
    Email: Yup.string().required('Email is required'),
    Password: Yup.string().required('Password is required'),
  });

  const [data] = React.useState(initialValues);

  const { values, errors, touched, handleBlur, handleSubmit, handleChange } = useFormik({
    initialValues: data,
    validationSchema: loginSchema,
    onSubmit: (values) => {
      const my_Email = values.Email;
      const my_Password = values.Password;
      axios
        .post(`http://localhost:5000/signin/admin`, 
          { email: my_Email, password: my_Password },
          {
            headers: {
              "Content-Type": "application/json"
            },
          }
        )
        .then((res) => {
          const access_token = res.data.token;
          ReactSession.set('access_token', access_token);
          console.log('Token set:', ReactSession.get('access_token'));
          navigate('/opts', { replace: true });
        })
        .catch((err) => {
          try {
            console.log(err.response.data.error);
            alert(err.response.data.error);
          } catch (error) {
            console.log("Password is wrong!");
            alert("Password is wrong!");
          }
        });
    },
  });

  return (
    <div className="App">
      <header className="App-header">
        <br />
        <h1>Admin Webpage</h1>
        <br />
        <p>Enter your credentials</p>
        <form onSubmit={handleSubmit}>
          <input
            type='text'
            placeholder='Enter Email'
            name='Email'
            value={values.Email}
            onChange={handleChange}
            onBlur={handleBlur}
            id='Email'
            autoComplete='off'
          />
          {errors.Email && touched.Email ? <div>{errors.Email}</div> : null}
          <input
            type='Password'
            placeholder='Enter Password'
            name='Password'
            value={values.Password}
            onChange={handleChange}
            onBlur={handleBlur}
            id='Password'
            autoComplete='off'
          />
          {errors.Password && touched.Password ? <div>{errors.Password}</div> : null}
          <button type='submit'>LOG IN</button>
        </form>
      </header>
    </div>
  );
}

export default App;
