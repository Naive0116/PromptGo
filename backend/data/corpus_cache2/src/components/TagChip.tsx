import React from 'react';
import './TagChip.css'; // Will create this CSS file

interface TagChipProps {
  tag: string;
}

const TagChip: React.FC<TagChipProps> = ({ tag }) => {
  return (
    <span className="tag-chip">
      {tag}
    </span>
  );
};

export default TagChip;
