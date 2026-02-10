// UI Components barrel export
// This file exports all reusable UI components for easy imports

// Button
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

// Input
export { Input, inputVariants } from "./input";
export type { InputProps } from "./input";

// Textarea
export { Textarea, textareaVariants } from "./textarea";
export type { TextareaProps } from "./textarea";

// Card
export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
	StatCard,
	cardVariants,
} from "./card";
export type { CardProps } from "./card";

// Badge
export { Badge, StatusBadge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";

// Checkbox
export { Checkbox } from "./checkbox";

// Popover
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose } from "./popover";

// Category multi-select (searchable, for product category assignment)
export { CategoryMultiSelect } from "./category-multi-select";
export type { CategoryOption } from "./category-multi-select";

// Select
export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
	SelectField,
	selectTriggerVariants,
} from "./select";
export type { SelectTriggerProps } from "./select";

// Dialog
export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogClose,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
	SheetContent,
	ConfirmDialog,
	dialogContentVariants,
	sheetVariants,
} from "./dialog";
export type { DialogContentProps, SheetContentProps } from "./dialog";

// Table
export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
	SortableHeader,
	TableEmpty,
	TableLoading,
	TablePagination,
	tableVariants,
} from "./table";
export type { TableProps } from "./table";

// Tabs
export {
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
	VerticalTabs,
	SimpleTabs,
	tabsListVariants,
	tabsTriggerVariants,
} from "./tabs";
export type { TabsListProps, TabsTriggerProps } from "./tabs";

// Avatar
export { Avatar, AvatarGroup, UserAvatar, avatarVariants } from "./avatar";
export type { AvatarProps } from "./avatar";

// Dropdown Menu
export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuRadioGroup,
	SimpleDropdownMenu,
} from "./dropdown-menu";

// Skeleton
export {
	Skeleton,
	SkeletonText,
	SkeletonCircle,
	SkeletonCard,
	SkeletonAvatar,
	SkeletonButton,
} from "./skeleton";
export type {} from "./skeleton";
