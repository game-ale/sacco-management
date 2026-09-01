export interface CSVColumn<T> {
  header: string
  accessor: (item: T) => string | number | boolean | null | undefined
}

export function exportToCSV<T>(
  filename: string,
  columns: CSVColumn<T>[],
  data: T[]
): boolean {
  if (!data || data.length === 0) {
    return false
  }

  // Create header line
  const headers = columns.map(col => escapeCSVValue(col.header)).join(',')

  // Create data lines
  const rows = data.map(item => {
    return columns
      .map(col => {
        const val = col.accessor(item)
        return escapeCSVValue(val)
      })
      .join(',')
  })

  const csvContent = [headers, ...rows].join('\r\n')

  // Create Blob & download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return true
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '""'
  }
  const str = String(value)
  // If string contains comma, double-quote, or newline, enclose in double quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}
