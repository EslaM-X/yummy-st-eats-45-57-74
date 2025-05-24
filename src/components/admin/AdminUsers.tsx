
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { AdminService } from '@/services/AdminService';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: 'customer' | 'restaurant_owner' | 'admin';
  created_at: string;
  updated_at: string;
  address?: string;
  avatar_url?: string;
}

const AdminUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAllUsers();
      
      // تنسيق البيانات لتطابق النوع المطلوب
      const formattedUsers: User[] = data.map(user => ({
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        user_type: (user.user_type === 'customer' || user.user_type === 'restaurant_owner' || user.user_type === 'admin') 
          ? user.user_type 
          : 'customer',
        created_at: user.created_at,
        updated_at: user.updated_at,
        address: user.address || undefined,
        avatar_url: user.avatar_url || undefined,
      }));
      
      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ في تحميل المستخدمين",
        description: error.message || "حدث خطأ أثناء تحميل بيانات المستخدمين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term and tab
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = selectedTab === 'all' ||
                      (selectedTab === 'customers' && user.user_type === 'customer') ||
                      (selectedTab === 'restaurant_owners' && user.user_type === 'restaurant_owner') ||
                      (selectedTab === 'admins' && user.user_type === 'admin');
    
    return matchesSearch && matchesTab;
  });

  // Functions for actions
  const handleEditUser = (userId: string) => {
    toast({
      title: "تعديل المستخدم",
      description: `تم فتح تعديل المستخدم ${userId}`,
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      await AdminService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: "تم حذف المستخدم",
        description: "تم حذف المستخدم بنجاح",
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "خطأ في حذف المستخدم",
        description: error.message || "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive",
      });
    }
  };

  const handleAddNewUser = () => {
    toast({
      title: "إضافة مستخدم",
      description: "تم فتح نموذج إضافة مستخدم جديد",
    });
  };

  // Get user type badge style
  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'customer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'restaurant_owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'admin':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'customer':
        return 'عميل';
      case 'restaurant_owner':
        return 'صاحب مطعم';
      case 'admin':
        return 'مدير';
      default:
        return 'غير محدد';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>المستخدمين ({users.length})</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث عن مستخدم..."
                className="pl-8 pr-4 w-full"
              />
            </div>
            <Button onClick={handleAddNewUser} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
              مستخدم جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="all">الكل ({users.length})</TabsTrigger>
              <TabsTrigger value="customers">عملاء ({users.filter(u => u.user_type === 'customer').length})</TabsTrigger>
              <TabsTrigger value="restaurant_owners">مطاعم ({users.filter(u => u.user_type === 'restaurant_owner').length})</TabsTrigger>
              <TabsTrigger value="admins">مدراء ({users.filter(u => u.user_type === 'admin').length})</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="px-4 py-3 text-right rtl:text-left">المستخدم</th>
                  <th className="px-4 py-3 text-right rtl:text-left">رقم الهاتف</th>
                  <th className="px-4 py-3 text-right rtl:text-left">النوع</th>
                  <th className="px-4 py-3 text-right rtl:text-left">تاريخ الإنضمام</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 rtl:mr-0 rtl:ml-3">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || 'غير محدد'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.phone || 'غير محدد'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={getUserTypeBadge(user.user_type)}>
                          {getUserTypeLabel(user.user_type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2 rtl:space-x-reverse">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user.id)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">تعديل</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">حذف</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      لا يوجد مستخدمين مطابقين لمعايير البحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
