"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { 
  fetchCompanies, 
  fetchCommitteesByCompany, 
  fetchProtocolsByCommittee,
  type Company,
  type Committee,
  type ProtocolForFilter
} from "../../protocols/[id]/supabaseApi";

interface CascadingFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: {
    companyId: string | null;
    committeeId: string | null;
    protocolId: string | null;
  }) => void;
  currentFilters: {
    companyId: string | null;
    committeeId: string | null;
    protocolId: string | null;
  };
}

export function CascadingFilterDialog({
  open,
  onOpenChange,
  onApplyFilters,
  currentFilters
}: CascadingFilterDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [protocols, setProtocols] = useState<ProtocolForFilter[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedCompany, setSelectedCompany] = useState<string | null>(currentFilters.companyId);
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(currentFilters.committeeId);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(currentFilters.protocolId);

  // Load companies on mount
  useEffect(() => {
    if (open) {
      loadCompanies();
    }
  }, [open]);

  // Load committees when company changes
  useEffect(() => {
    if (selectedCompany) {
      loadCommittees(selectedCompany);
      setSelectedCommittee(null);
      setSelectedProtocol(null);
    } else {
      setCommittees([]);
      setSelectedCommittee(null);
      setSelectedProtocol(null);
    }
  }, [selectedCompany]);

  // Load protocols when committee changes
  useEffect(() => {
    if (selectedCommittee) {
      loadProtocols(selectedCommittee);
      setSelectedProtocol(null);
    } else {
      setProtocols([]);
      setSelectedProtocol(null);
    }
  }, [selectedCommittee]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const companiesData = await fetchCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommittees = async (companyId: string) => {
    try {
      setLoading(true);
      const committeesData = await fetchCommitteesByCompany(companyId);
      setCommittees(committeesData);
    } catch (error) {
      console.error("Error loading committees:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProtocols = async (committeeId: string) => {
    try {
      setLoading(true);
      const protocolsData = await fetchProtocolsByCommittee(committeeId);
      setProtocols(protocolsData);
    } catch (error) {
      console.error("Error loading protocols:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApplyFilters({
      companyId: selectedCompany,
      committeeId: selectedCommittee,
      protocolId: selectedProtocol,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    setSelectedCompany(null);
    setSelectedCommittee(null);
    setSelectedProtocol(null);
  };

  const handleCancel = () => {
    // Reset to current filters
    setSelectedCompany(currentFilters.companyId);
    setSelectedCommittee(currentFilters.committeeId);
    setSelectedProtocol(currentFilters.protocolId);
    onOpenChange(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCompany) count++;
    if (selectedCommittee) count++;
    if (selectedProtocol) count++;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Company Filter */}
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Select
              value={selectedCompany || "all"}
              onValueChange={(value) => setSelectedCompany(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Committee Filter */}
          <div className="space-y-2">
            <Label htmlFor="committee">Committee</Label>
            <Select
              value={selectedCommittee || "all"}
              onValueChange={(value) => setSelectedCommittee(value === "all" ? null : value)}
              disabled={!selectedCompany}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCompany ? "Select a committee" : "Select a company first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All committees</SelectItem>
                {committees.map((committee) => (
                  <SelectItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Protocol Filter */}
          <div className="space-y-2">
            <Label htmlFor="protocol">Protocol</Label>
            <Select
              value={selectedProtocol || "all"}
              onValueChange={(value) => setSelectedProtocol(value === "all" ? null : value)}
              disabled={!selectedCommittee}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCommittee ? "Select a protocol" : "Select a committee first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All protocols</SelectItem>
                {protocols.map((protocol) => (
                  <SelectItem key={protocol.id} value={protocol.id}>
                    #{protocol.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Filters Display */}
          {(selectedCompany || selectedCommittee || selectedProtocol) && (
            <div className="space-y-2">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCompany && (
                  <Badge variant="outline" className="gap-1">
                    Company: {companies.find(c => c.id === selectedCompany)?.name}
                    <button
                      onClick={() => setSelectedCompany(null)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCommittee && (
                  <Badge variant="outline" className="gap-1">
                    Committee: {committees.find(c => c.id === selectedCommittee)?.name}
                    <button
                      onClick={() => setSelectedCommittee(null)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedProtocol && (
                  <Badge variant="outline" className="gap-1">
                    Protocol: #{protocols.find(p => p.id === selectedProtocol)?.number}
                    <button
                      onClick={() => setSelectedProtocol(null)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!selectedCompany && !selectedCommittee && !selectedProtocol}
          >
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 