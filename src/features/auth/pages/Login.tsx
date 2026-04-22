import React from 'react';
import AuthForm from '../components/AuthForm';

// Page: just mounts the form. Logic lives in AuthForm → useLogin hook.
const Login: React.FC = () => {
  return <AuthForm />;
};

export default Login;
