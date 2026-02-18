"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Check, Trash2, RefreshCw, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface VerificationTeam {
  department: string;
  committees: Record<string, string[]>;
}

export default function VerificationTeamPage() {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [committeeIds, setCommitteeIds] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [allFaculty, setAllFaculty] = useState<Faculty[]>([]);
  const [suggestions, setSuggestions] = useState<Faculty[]>([]);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [verificationTeams, setVerificationTeams] = useState<Record<string, VerificationTeam>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [deletedVerifiers, setDeletedVerifiers] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { token } = useAuth();

  // Fetch all faculty data when component mounts
  useEffect(() => {
    fetchFacultyData();
    fetchAllVerificationTeams();
  }, []);

  const fetchFacultyData = async () => {
    try {
      const response = await fetch('/api/verification-team/users');
      if (!response.ok) throw new Error('Failed to fetch faculty data');
      const data = await response.json();
      setAllFaculty(data);
    } catch (err: any) {
      setError('Error loading faculty data: ' + err.message);
    }
  };

  const fetchAllVerificationTeams = async () => {
    setIsLoading(true);
    try {
      const teamsData: Record<string, VerificationTeam> = {};
      
      const promises = DEPARTMENTS.map(async (dept) => {
        try {
          const response = await fetch('/api/verification-team/committee', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ department: dept.value }),
          });
          if (response.ok) {
            const data = await response.json();
            teamsData[dept.value] = data;
          }
        } catch (error) {
          console.error(`Error fetching ${dept.value} verification team:`, error);
        }
      });
      
      await Promise.all(promises);
      setVerificationTeams(teamsData);
    } catch (err: any) {
      setError('Error loading verification teams: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMore = () => {
    setCommitteeIds([...committeeIds, ""]);
    setSuggestions([]);
  };

  const handleCommitteeIdChange = (index: number, value: string) => {
    const newCommitteeIds = [...committeeIds];
    newCommitteeIds[index] = value;
    setCommitteeIds(newCommitteeIds);
    setActiveInputIndex(index);

    if (value.trim() && selectedDepartment) {
      const filtered = allFaculty
        .filter(faculty => 
          (faculty.userId.toLowerCase().includes(value.toLowerCase()) ||
           faculty.name.toLowerCase().includes(value.toLowerCase())) &&
          faculty.department !== selectedDepartment &&
          !committeeIds.includes(faculty.userId)
        )
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (index: number, faculty: Faculty) => {
    const newCommitteeIds = [...committeeIds];
    newCommitteeIds[index] = faculty.userId;
    setCommitteeIds(newCommitteeIds);
    setSuggestions([]);
  };

  const handleDeleteVerifier = (indexToDelete: number) => {
    const deletedId = committeeIds[indexToDelete];
    
    if (deletedId && deletedId.trim() !== "") {
      setDeletedVerifiers(prev => {
        if (!prev.includes(deletedId)) {
          return [...prev, deletedId];
        }
        return prev;
      });
    }
    
    setCommitteeIds(committeeIds.filter((_, index) => index !== indexToDelete));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/verification-team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          department: selectedDepartment,
          committee_ids: committeeIds,
          deleted_verifiers: deletedVerifiers
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create verification committee');
      }
  
      setSuccessMessage(`Verification committee ${editingDepartment ? 'updated' : 'created'} successfully!`);
      setShowSuccessDialog(true);
      
      if (!editingDepartment) {
        setSelectedDepartment('');
      }
      setCommitteeIds(['']);
      setDeletedVerifiers([]);
      fetchAllVerificationTeams();
  
    } catch (error: any) {
      console.error('Error creating verification committee:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = (department: string) => {
    const teamData = verificationTeams[department];
    if (teamData && teamData.committees) {
      try {
        const committeeIdsToEdit = Object.keys(teamData.committees).map(key => {
          const idPart = key.split(' ')[0];
          return idPart;
        });
        
        setSelectedDepartment(department);
        setCommitteeIds(committeeIdsToEdit.length > 0 ? committeeIdsToEdit : [""]);
        setEditingDepartment(department);
        setDeletedVerifiers([]);
        
        setTimeout(() => {
          const formElement = document.querySelector('.allocate-committee-form');
          if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } catch (error) {
        console.error("Error preparing team for editing:", error);
        setError("Failed to load committee data for editing.");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingDepartment(null);
    setSelectedDepartment("");
    setCommitteeIds([""]);
    setError(null);
  };

  const getDepartmentLabel = (value: string) => {
    const dept = DEPARTMENTS.find(d => d.value === value);
    return dept?.label || value;
  };

  return (
    <div className="space-y-8 p-6">
      {/* Form to allocate verification committee */}
      <Card className="allocate-committee-form">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="mr-2 text-blue-600" />
              {editingDepartment ? `Edit ${getDepartmentLabel(editingDepartment)} Verification Committee` : "Allocate Verification Committee"}
            </CardTitle>
            {editingDepartment && (
              <Button
                variant="ghost"
                onClick={handleCancelEdit}
                size="sm"
              >
                Cancel Editing
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* Department Selection */}
            <div className="space-y-2">
              <Label>Select Department</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                disabled={editingDepartment !== null}
              >
                <SelectTrigger>
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
              {selectedDepartment && (
                <p className="text-sm text-gray-600">
                  Note: You can only select verification committee members from departments other than {getDepartmentLabel(selectedDepartment)}
                </p>
              )}
            </div>

            {/* Committee Head IDs */}
            <div className="space-y-4">
              {committeeIds.map((id, index) => (
                <div key={index} className="relative">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={id}
                      onChange={(e) => handleCommitteeIdChange(index, e.target.value)}
                      placeholder="Enter faculty ID or name"
                      required
                    />
                    {(committeeIds.length > 1 || editingDepartment) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => editingDepartment ? handleDeleteVerifier(index) : handleDeleteVerifier(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={20} />
                      </Button>
                    )}
                  </div>
                  
                  {/* Suggestions Dropdown */}
                  {suggestions.length > 0 && activeInputIndex === index && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      {suggestions.map((faculty) => (
                        <div
                          key={faculty._id}
                          onClick={() => handleSuggestionClick(index, faculty)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium">{faculty.userId}</span>
                            <span className="text-gray-600 ml-2">({faculty.name})</span>
                          </div>
                          <span className="text-gray-500 text-sm">{getDepartmentLabel(faculty.department)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMore}
              >
                <Plus className="mr-2" size={18} />
                Add Another Head
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? "Processing..." : editingDepartment ? "Update Committee" : "Save Committee"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Display Verification Teams */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="mr-2 text-blue-600" />
              Current Verification Committees
            </CardTitle>
            <Button 
              variant="outline"
              size="sm"
              onClick={fetchAllVerificationTeams}
            >
              <RefreshCw size={16} className="mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DEPARTMENTS.map(department => {
                const teamData = verificationTeams[department.value];
                return (
                  <Card key={department.value}>
                    <CardHeader className="bg-gray-50">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{department.label}</CardTitle>
                        {teamData && teamData.committees && Object.keys(teamData.committees).length > 0 && (
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTeam(department.value)}
                          >
                            <Edit2 size={16} />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      {!teamData ? (
                        <p className="text-gray-600 text-sm italic">No verification committee assigned</p>
                      ) : teamData.committees && Object.keys(teamData.committees).length > 0 ? (
                        <ul className="space-y-4">
                          {Object.entries(teamData.committees).map(([verifier, verifiees], index) => {
                            let verifierId = verifier;
                            let verifierName = "";
                            
                            const parenthesesMatch = verifier.match(/^(.*?)\s*\((.*?)\)$/);
                            if (parenthesesMatch) {
                              verifierId = parenthesesMatch[1].trim();
                              verifierName = parenthesesMatch[2].trim();
                            }
                            
                            return (
                              <li key={index} className="pb-3 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-2 text-sm mb-1">
                                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">
                                    {index + 1}
                                  </span>
                                  <div>
                                    {verifierName ? (
                                      <>
                                        <span className="font-medium">{verifierName}</span>
                                        <span className="text-gray-500 text-xs ml-2">({verifierId})</span>
                                      </>
                                    ) : (
                                      <span className="font-medium">{verifierId}</span>
                                    )}
                                  </div>
                                </div>
                                {Array.isArray(verifiees) && verifiees.length > 0 ? (
                                  <div className="ml-8 mt-2">
                                    <span className="text-xs font-medium text-gray-500 block mb-1">Assigned Faculty:</span>
                                    <ul className="space-y-1">
                                      {verifiees.map((faculty, idx) => (
                                        <li key={idx} className="text-xs text-gray-600 flex items-center">
                                          <span className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs mr-2">
                                            {idx + 1}
                                          </span>
                                          {faculty}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <div className="ml-8 mt-1">
                                    <span className="text-xs text-gray-500 italic">No faculty assigned yet</span>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-600 text-sm italic">No verification committee assigned</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
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
              {successMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccessDialog(false);
                setSuccessMessage("");
              }}
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
