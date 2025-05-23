
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FoodSubmissionForm from '@/components/add-food/FoodSubmissionForm';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const AddFoodPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4">
            <LogIn className="h-16 w-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-4">تسجيل الدخول مطلوب</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              يجب تسجيل الدخول أولاً لإضافة طعام جديد
            </p>
            <Link to="/login">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <FoodSubmissionForm />
      </main>
      <Footer />
    </div>
  );
};

export default AddFoodPage;
