import { h } from 'preact';

interface IconProps {
    size?: number;
    class?: string;
}

export const FolderIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M1.5 2A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V5a1.5 1.5 0 00-1.5-1.5H7.707L6.354 2.146A.5.5 0 006 2H1.5z" />
    </svg>
);

export const FolderOpenIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M1 3.5A1.5 1.5 0 012.5 2H6a.5.5 0 01.354.146L7.707 3.5H14.5A1.5 1.5 0 0116 5v.382l-1.723 7.756A1.5 1.5 0 0112.809 14H1.5A1.5 1.5 0 010 12.5v-9A1.5 1.5 0 011 3.5zM2.5 3a.5.5 0 00-.5.5V6h13V5a.5.5 0 00-.5-.5H7.5a.5.5 0 01-.354-.146L5.793 3H2.5z" />
    </svg>
);

export const ChevronRightIcon = ({ size = 12, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z" />
    </svg>
);

export const ChevronDownIcon = ({ size = 12, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z" />
    </svg>
);

export const PlusIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
    </svg>
);

export const TrashIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
        <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H5.5a1 1 0 011-1h3a1 1 0 011 1h2.5a1 1 0 011 1v1zM4 4v9a1 1 0 001 1h6a1 1 0 001-1V4H4zM5 2h6v1H5V2z" />
    </svg>
);

export const EditIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5z" />
    </svg>
);

export const SearchIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z" />
    </svg>
);

export const CursorIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M14.082 2.182a.5.5 0 01.103.557L8.528 15.467a.5.5 0 01-.917-.007L5.57 10.694.803 8.652a.5.5 0 01-.006-.916l12.728-5.657a.5.5 0 01.557.103z" />
    </svg>
);

export const TagIcon = ({ size = 12, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M2 1a1 1 0 00-1 1v4.586a1 1 0 00.293.707l7 7a1 1 0 001.414 0l4.586-4.586a1 1 0 000-1.414l-7-7A1 1 0 006.586 1H2zm4 3.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
);

export const SnippetIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <path d="M10.478 1.647a.5.5 0 10-.956-.294l-4 13a.5.5 0 00.956.294l4-13zM4.854 4.146a.5.5 0 010 .708L1.707 8l3.147 3.146a.5.5 0 01-.708.708l-3.5-3.5a.5.5 0 010-.708l3.5-3.5a.5.5 0 01.708 0zm6.292 0a.5.5 0 000 .708L14.293 8l-3.147 3.146a.5.5 0 00.708.708l3.5-3.5a.5.5 0 000-.708l-3.5-3.5a.5.5 0 00-.708 0z" />
    </svg>
);

export const GripDotsIcon = ({ size = 14, ...rest }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...rest}>
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
    </svg>
);
