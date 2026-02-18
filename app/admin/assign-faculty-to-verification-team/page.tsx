"use client";

import React, { useState, useEffect } from "react";
import { Users, Save, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DEPARTMENTS } from "@/lib/constants";

interface Faculty {
  _id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
}

interface Member {
  _id: string;
  userId: string;
  name: string;
}

interface AssignedFaculty {
  [committeeId: string]: string[];
}

export default function AssignFacultyToVerificationTeamPage() {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [committees, setCommittees] = useState<Member[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [assignedFaculty, setAssignedFaculty] = useState<AssignedFaculty>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { toast } = useToast();
  const { token } = useAuth();

  // Fetch department data when selected
  useEffect(() => {
    if (selectedDepartment) {
      fetchDepartmentData(selectedDepartment);
    } else {
      setCommittees([]);
      setFaculties([]);
      setAssignedFaculty({});
    }
  }, [selectedDepartment]);

  const fetchDepartmentData = async (department: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/verification-team/committee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ department }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch verification committee data');
      }

      const data = await response.json();

      // Extract committee members
      const committeeMembers: Member[] = [];
      const initialAssignments: AssignedFaculty = {};

      if (data.committees) {
        Object.entries(data.committees).forEach(([verifier, verifiees]) => {
          // Parse verifier ID and name
          const match = verifier.match(/^(.*?)\s*\((.*?)\)$/);
          const verifierId = match ? match[1].trim() : verifier;
          const verifierName = match ? match[2].trim() : "";

          committeeMembers.push({
            _id: verifierId,
            userId: verifierId,
            name: verifierName,
          });

          // Set initial assignments
          initialAssignments[verifierId] = Array.isArray(verifiees) ? verifiees : [];
        });
      }

      setCommittees(committeeMembers);
      setAssignedFaculty(initialAssignments);

      // Fetch faculty list for this department
      const facultyResponse = await fetch('/api/verification-team/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!facultyResponse.ok) {
        throw new Error('Failed to fetch faculty list');
      }

      const facultyData = await facultyResponse.json();
      const departmentFaculty = facultyData.filter(
        (f: Faculty) => f.department === department
      );
      setFaculties(departmentFaculty);

    } catch (err: any) {
      console.error('Error fetching department data:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyAssignment = (committeeId: string, facultyId: string) => {
    setAssignedFaculty(prev => {
      const newAssignments = { ...prev };
      
      // Remove faculty from all committees first
      Object.keys(newAssignments).forEach(key => {
        newAssignments[key] = newAssignments[key].filter(id => id !== facultyId);
      });
      
      // Add faculty to selected committee
      if (!newAssignments[committeeId]) {
        newAssignments[committeeId] = [];
      }
      newAssignments[committeeId].push(facultyId);
      
      return newAssignments;
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/verification-team/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          department: selectedDepartment,
          assignments: assignedFaculty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign faculty to verification committee');
      }

      setShowSuccessDialog(true);
      fetchDepartmentData(selectedDepartment); // Refresh data

    } catch (err: any) {
      console.error('Error assigning faculty:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssignedCommittee = (facultyId: string): string | null => {
    for (const [committeeId, facultyList] of Object.entries(assignedFaculty)) {
      if (facultyList.includes(facultyId)) {
        return committeeId;
      }
    }
    return null;
  };

  const getDepartmentLabel = (value: string) => {
    const dept = DEPARTMENTS.find(d => d.value === value);
    return dept?.label || value;
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center">
            <Users className="mr-2 text-blue-600" />
            Assign Faculty to Verification Committee
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {/* Department Selection */}
          <div className="space-y-4 mb-6">
            <Label>Select Department</Label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && committees.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* No Committee Message */}
          {!loading && selectedDepartment && committees.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                No verification committee has been assigned to {getDepartmentLabel(selectedDepartment)} department yet.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Please create a verification committee first.
              </p>
            </div>
          )}

          {/* Faculty Assignment Table */}
          {!loading && selectedDepartment && committees.length > 0 && faculties.length > 0 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Committee Members ({committees.length}):</strong>{' '}
                  {committees.map((c, idx) => (
                    <span key={c._id}>
                      {c.name || c.userId}
                      {idx < committees.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">
                        Faculty ID
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">
                        Faculty Name
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">
                        Assign to Committee Member
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculties.map((faculty) => {
                      const assignedTo = getAssignedCommittee(faculty.userId);
                      return (
                        <tr key={faculty._id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3">
                            {faculty.userId}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {faculty.name}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            <Select
                              value={assignedTo || ""}
                              onValueChange={(value) => handleFacultyAssignment(value, faculty.userId)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Committee Member" />
                              </SelectTrigger>
                              <SelectContent>
                                {committees.map((committee) => (
                                  <SelectItem key={committee._id} value={committee.userId}>
                                    {committee.name || committee.userId}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="min-w-[150px]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={18} />
                      Save Assignments
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {!loading && selectedDepartment && faculties.length === 0 && committees.length > 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                No faculty members found in {getDepartmentLabel(selectedDepartment)} department.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4">
              <Check className="text-green-600" size={36} />
            </div>
            <AlertDialogTitle className="text-center">Success</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Faculty members have been successfully assigned to verification committee members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
