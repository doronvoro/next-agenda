import React from "react";
import AppDropdown from "@/components/AppDropdown";

interface Committee {
  id: string;
  name: string;
}

interface CommitteeDropdownProps {
  committees: Committee[];
  selectedCommittee: string;
  setSelectedCommittee: (value: string) => void;
  setCurrentPage?: (page: number) => void;
  t: (key: string) => string;
}

const CommitteeDropdown: React.FC<CommitteeDropdownProps> = ({
  committees,
  selectedCommittee,
  setSelectedCommittee,
  setCurrentPage,
  t,
}) => {
  return (
    <AppDropdown
      label={t("committee")}
      value={selectedCommittee}
      onChange={(value) => {
        setSelectedCommittee(value);
        if (setCurrentPage) setCurrentPage(1);
      }}
      options={[
        { value: "all", label: t("allCommittees") },
        ...committees.map((committee) => ({ value: committee.id, label: committee.name }))
      ]}
      placeholder={t("allCommittees")}
    />
  );
};

export default CommitteeDropdown; 