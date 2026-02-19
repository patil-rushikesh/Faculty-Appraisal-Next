"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Trash2, Users, X } from "lucide-react";
import Loader from "@/components/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/AuthProvider";
import { useRouter } from "next/navigation";
import { DEPARTMENTS, ROLES } from "@/lib/constants";

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  mobile?: string;
  designation?: string;
  status?: string;
  createdAt?: Date;
}

export default function FacultyListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();
  const router = useRouter();

  // Fetch users from backend
  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/faculty`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch faculty members",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error fetching faculty members:", err);
        toast({
          title: "Error",
          description: "An error occurred while fetching faculty members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    getUsers();
  }, [token, toast]);

  // Filter users based on search term, role, and department
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/faculty`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: userToDelete.userId }),
        },
      );
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.userId !== userToDelete.userId));
        toast({
          title: "Success",
          description: "User deleted successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while deleting user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setDepartmentFilter("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || roleFilter !== "all" || departmentFilter !== "all";

  // Get role label
  const getRoleLabel = (value: string) => {
    const role = ROLES.find(r => r.value === value);
    return role?.label || value;
  };

  // Get department label
  const getDepartmentLabel = (value: string) => {
    const dept = DEPARTMENTS.find(d => d.value === value);
    return dept?.label || value;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Filters Section */}
      <motion.div
        className="mb-6 space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-4 flex-col md:flex-row">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-3 text-muted-foreground"
              size={20}
            />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-64">
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-64">
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Faculty Button */}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 whitespace-nowrap"
            onClick={() => router.push('/admin/add-faculty')}
          >
            <Plus size={20} />
            Add Faculty
          </Button>
        </div>

        {/* Active Filters Display and Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchTerm}
              </Badge>
            )}
            {roleFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Role: {getRoleLabel(roleFilter)}
              </Badge>
            )}
            {departmentFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Department: {getDepartmentLabel(departmentFilter)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              <X size={14} className="mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </motion.div>

      {/* Faculty List Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-serif flex items-center justify-between">
              <span>Faculty List</span>
              <Badge variant="outline">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {loading ? (
                <Loader message="Loading faculty..." />
              ) : filteredUsers.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        User ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Department
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Email
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.userId}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground font-mono text-sm">
                          {user.userId}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {user.name}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="default" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                            {getRoleLabel(user.role)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {getDepartmentLabel(user.department)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserToDelete(user)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="w-full py-12 flex flex-col justify-center items-center text-muted-foreground">
                  <Users className="w-10 h-10 mb-2" />
                  <p className="text-sm">
                    {hasActiveFilters ? "No users match your filters" : "No users found"}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the user <strong>{userToDelete?.name}</strong> (ID: {userToDelete?.userId}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader variant="inline" className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
