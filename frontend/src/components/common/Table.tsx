import { ReactNode } from 'react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  width?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string | number
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="table-container">
        <div style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-tertiary)' }}>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }}>{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={String(column.key) || index}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((column, index) => (
                <td key={String(column.key) || index}>
                  {column.render
                    ? column.render(row)
                    : String(row[column.key as keyof T] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Simple table for basic use cases
interface SimpleTableProps {
  headers: string[]
  rows: (string | number | ReactNode)[][]
  className?: string
}

export const SimpleTable = ({ headers, rows, className = '' }: SimpleTableProps) => {
  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
