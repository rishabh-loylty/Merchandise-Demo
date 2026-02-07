"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
	ChevronDown,
	ChevronUp,
	ChevronsUpDown,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

const tableVariants = cva("w-full caption-bottom text-sm", {
	variants: {
		variant: {
			default: "",
			striped: "[&_tbody_tr:nth-child(even)]:bg-muted/50",
			bordered: "[&_th]:border [&_td]:border",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export interface TableProps
	extends React.HTMLAttributes<HTMLTableElement>,
		VariantProps<typeof tableVariants> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
	({ className, variant, ...props }, ref) => (
		<div className="relative w-full overflow-auto rounded-lg border border-border">
			<table
				ref={ref}
				className={cn(tableVariants({ variant, className }))}
				{...props}
			/>
		</div>
	),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead
		ref={ref}
		className={cn("bg-muted/50 [&_tr]:border-b", className)}
		{...props}
	/>
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		ref={ref}
		className={cn("[&_tr:last-child]:border-0", className)}
		{...props}
	/>
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		ref={ref}
		className={cn(
			"border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
			className,
		)}
		{...props}
	/>
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn(
			"border-b border-border transition-colors hover:bg-muted/30 data-[state=selected]:bg-accent",
			className,
		)}
		{...props}
	/>
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th
		ref={ref}
		className={cn(
			"h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
			className,
		)}
		{...props}
	/>
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<td
		ref={ref}
		className={cn(
			"px-4 py-3 align-middle text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
			className,
		)}
		{...props}
	/>
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		ref={ref}
		className={cn("mt-4 text-sm text-muted-foreground", className)}
		{...props}
	/>
));
TableCaption.displayName = "TableCaption";

// Sortable header component
type SortDirection = "asc" | "desc" | null;

interface SortableHeaderProps
	extends React.ThHTMLAttributes<HTMLTableCellElement> {
	sortDirection?: SortDirection;
	onSort?: () => void;
}

const SortableHeader = React.forwardRef<
	HTMLTableCellElement,
	SortableHeaderProps
>(({ className, children, sortDirection, onSort, ...props }, ref) => (
	<TableHead
		ref={ref}
		className={cn("cursor-pointer select-none", className)}
		{...props}
	>
		<button
			type="button"
			onClick={onSort}
			className="flex items-center gap-1.5 hover:text-foreground"
		>
			{children}
			{sortDirection === "asc" ? (
				<ChevronUp className="h-3.5 w-3.5" />
			) : sortDirection === "desc" ? (
				<ChevronDown className="h-3.5 w-3.5" />
			) : (
				<ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
			)}
		</button>
	</TableHead>
));
SortableHeader.displayName = "SortableHeader";

// Empty state component
interface TableEmptyProps extends React.HTMLAttributes<HTMLTableRowElement> {
	colSpan?: number;
	icon?: React.ReactNode;
	title?: string;
	description?: string;
	action?: React.ReactNode;
}

const TableEmpty = React.forwardRef<HTMLTableRowElement, TableEmptyProps>(
	(
		{
			className,
			colSpan = 100,
			icon,
			title = "No data found",
			description,
			action,
			...props
		},
		ref,
	) => (
		<TableRow
			ref={ref}
			className={cn("hover:bg-transparent", className)}
			{...props}
		>
			<TableCell colSpan={colSpan} className="h-48 text-center">
				<div className="flex flex-col items-center justify-center gap-2">
					{icon && (
						<div className="flex h-12 w-12 items-center justify-center text-muted-foreground">
							{icon}
						</div>
					)}
					<p className="text-lg font-medium text-foreground">{title}</p>
					{description && (
						<p className="text-sm text-muted-foreground">{description}</p>
					)}
					{action && <div className="mt-2">{action}</div>}
				</div>
			</TableCell>
		</TableRow>
	),
);
TableEmpty.displayName = "TableEmpty";

// Loading state component
interface TableLoadingProps extends React.HTMLAttributes<HTMLTableRowElement> {
	colSpan: number;
	rows?: number;
}

const TableLoading = React.forwardRef<HTMLTableRowElement, TableLoadingProps>(
	({ className, colSpan, rows = 5, ...props }, ref) => (
		<>
			{Array.from({ length: rows }).map((_, i) => (
				<TableRow
					key={i}
					ref={i === 0 ? ref : undefined}
					className={cn("hover:bg-transparent", className)}
					{...props}
				>
					<TableCell colSpan={colSpan}>
						<div className="flex animate-pulse items-center gap-4">
							<div className="h-10 w-10 rounded-lg bg-muted" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-3/4 rounded bg-muted" />
								<div className="h-3 w-1/2 rounded bg-muted" />
							</div>
						</div>
					</TableCell>
				</TableRow>
			))}
		</>
	),
);
TableLoading.displayName = "TableLoading";

// Pagination component
interface TablePaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
	onItemsPerPageChange?: (itemsPerPage: number) => void;
	itemsPerPageOptions?: number[];
	className?: string;
}

const TablePagination = ({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	onItemsPerPageChange,
	itemsPerPageOptions = [10, 20, 50, 100],
	className,
}: TablePaginationProps) => {
	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-between gap-4 border-t border-border px-4 py-3 sm:flex-row",
				className,
			)}
		>
			<div className="flex items-center gap-4">
				{onItemsPerPageChange && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">
							Rows per page:
						</span>
						<select
							value={itemsPerPage}
							onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
							className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						>
							{itemsPerPageOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</div>
				)}
				<span className="text-sm text-muted-foreground">
					Showing {startItem}-{endItem} of {totalItems}
				</span>
			</div>
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage <= 1}
					className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
					aria-label="Previous page"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				{generatePaginationRange(currentPage, totalPages).map((page, i) =>
					page === "..." ? (
						<span
							key={`ellipsis-${i}`}
							className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
						>
							...
						</span>
					) : (
						<button
							key={page}
							type="button"
							onClick={() => onPageChange(page as number)}
							className={cn(
								"inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
								currentPage === page
									? "bg-primary text-primary-foreground"
									: "border border-border bg-background text-foreground hover:bg-muted",
							)}
						>
							{page}
						</button>
					),
				)}
				<button
					type="button"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
					className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
					aria-label="Next page"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
};

// Helper function for pagination range
function generatePaginationRange(
	currentPage: number,
	totalPages: number,
): (number | "...")[] {
	const delta = 1;
	const range: (number | "...")[] = [];

	for (
		let i = Math.max(2, currentPage - delta);
		i <= Math.min(totalPages - 1, currentPage + delta);
		i++
	) {
		range.push(i);
	}

	if (currentPage - delta > 2) {
		range.unshift("...");
	}
	if (currentPage + delta < totalPages - 1) {
		range.push("...");
	}

	range.unshift(1);
	if (totalPages > 1) {
		range.push(totalPages);
	}

	return range;
}

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
};
