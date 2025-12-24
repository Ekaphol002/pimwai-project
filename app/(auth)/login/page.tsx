"use client";

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Home } from 'lucide-react';
// ✅ 1. เพิ่มไอคอนลูกตา (FaEye, FaEyeSlash)
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // ✅ 2. เพิ่ม State สำหรับสลับดูรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    general: ''
  });

  const toggleView = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '' });
    setErrors({ username: '', email: '', password: '', general: '' });
    setShowPassword(false); // รีเซ็ตให้ซ่อนรหัสทุกครั้งที่สลับหน้า
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/lessons' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: '', general: '' });
    }
  };

  // ฟังก์ชันสลับสถานะตา
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { username: '', email: '', password: '', general: '' };

    if (!isLogin) {
      if (!formData.username.trim()) {
        newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
        isValid = false;
      } else if (formData.username.length < 4 || formData.username.length > 30) {
        newErrors.username = 'ชื่อต้องยาว 4-30 ตัวอักษร';
        isValid = false;
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
      isValid = false;
    } else if (!isLogin) {
      if (formData.password.length < 8) {
        newErrors.password = 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร';
        isValid = false;
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'ต้องมีตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก และตัวเลขอย่างน้อย 1 ตัว';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    if (isLogin) {
      const res = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        setErrors(prev => ({ ...prev, general: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }));
        setLoading(false);
      } else {
        router.push('/lessons');
      }
    } else {
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (res.ok) {
          await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            callbackUrl: '/lessons'
          });
        } else {
          if (data.message?.includes('ชื่อผู้ใช้')) {
            setErrors(prev => ({ ...prev, username: data.message }));
          } else if (data.message?.includes('อีเมล')) {
            setErrors(prev => ({ ...prev, email: data.message }));
          } else {
            setErrors(prev => ({ ...prev, general: data.message }));
          }
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, general: "เชื่อมต่อ Server ไม่ได้" }));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f0f4f8] flex items-center justify-center p-4 font-sans relative">
      <div className="absolute inset-0 z-0 opacity-[0.4]"
        style={{
          backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(to right, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl h-[550px] relative z-10">

        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#5cb5db] to-[#6dc6d6] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">

          {/* ส่วนหัว: โลโก้ (ซ้าย) ---- ปุ่มบ้าน (ขวา) */}
          <div className="z-10 flex justify-between items-center w-full">
            <Link
              href="/" className="text-3xl logo-font tracking-wide">Pimwai.com
            </Link>

            {/* ✅ ปุ่มบ้าน: ชิดขวา + ไอคอนสีเต็ม (Filled) */}
            <Link
              href="/"
              className="hover:bg-white/30 rounded-full text-white transition-all backdrop-blur-sm group"
              title="กลับหน้าหลัก"
            >
              {/* fill="white" ทำให้ไอคอนเป็นสีทึบ */}
              <Home size={22} className="group-hover:scale-110 transition-transform" />
            </Link>
          </div>

          <div className="flex-grow flex items-center justify-center relative z-10">
            <img src="/auth-illustration.png" className="w-250 h-70 object-contain" />
          </div>

          <div className="text-center z-10">
            <p className="text-blue-100 text-lg ">ฝึกพิมพ์ให้ไว เรียนรู้เทคโนโลยีได้ง่าย กับ Pimwai พัฒนาเร็วขึ้นทุกวัน เริ่มจากการพิมพ์แม่นยำ</p>
          </div>

          {/* Decorative circles */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute top-10 right-10 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-8 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">

            <div className="text-center mb-8">
              <h2 className="text-4xl logo-font text-gray-800 mb-2">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-gray-500 text-sm">
                {isLogin ? 'Please enter your details.' : 'Join us and start typing!'}
              </p>
            </div>

            {isLogin && (
              <div className="mb-6">
                <button onClick={handleGoogleLogin} className="group relative flex items-center justify-center gap-3 w-full h-[50px] bg-[#5cb5db] hover:bg-white border-1 border-[#5cb5db] rounded-xl transition-all duration-200 ease-in-out">
                  <div className="absolute left-1.5 bg-white p-1.5 rounded-lg group-hover:bg-transparent transition-colors">
                    <FcGoogle size={20} />
                  </div>
                  <span className="pl-8 font-medium text-white group-hover:text-[#5cb5db] transition-colors">Sign in with Google</span>
                </button>
                <div className="relative flex items-center my-6">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider">or continue with</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
                {errors.general}
              </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>

              {!isLogin && (
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all
                        ${errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#4585FF] focus:ring-[#4585FF]/20'}`}
                      type="text"
                      placeholder="Username"
                    />
                  </div>
                  {errors.username && <span className="text-red-500 text-xs ml-1 mt-1 block">{errors.username}</span>}
                </div>
              )}

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all
                      ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#4585FF] focus:ring-[#4585FF]/20'}`}
                    type="email"
                    placeholder="Email Address"
                  />
                </div>
                {errors.email && <span className="text-red-500 text-xs ml-1 mt-1 block">{errors.email}</span>}
              </div>

              {/* ✅ 3. ส่วน Password Input ที่แก้ใหม่ */}
              <div>
                <div className="relative">
                  {/* ไอคอนกุญแจซ้ายมือ */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>

                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    // ✅ สลับ type ตาม state
                    type={showPassword ? "text" : "password"}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all
                      ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#4585FF] focus:ring-[#4585FF]/20'}`}
                    placeholder="Password"
                  />

                  {/* ✅ ปุ่มลูกตา ขวามือ */}
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </div>
                </div>
                {errors.password && <span className="text-red-500 text-xs ml-1 mt-1 block">{errors.password}</span>}
              </div>

              <button
                disabled={loading}
                className="w-full bg-[#5cb5db] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
              >
                {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
            </form>

            <p className="text-center text-gray-600 mt-8 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={toggleView} className="text-[#5cb5db] font-bold hover:underline transition-all">
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}