"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiGet, apiPost } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Download, Upload, FileSpreadsheet, AlertCircle } from "lucide-react"

interface ImportExportProps {
  endpoint: string
  entityName: string
  fields: string[] // Field names for export
}

export function ImportExport({ endpoint, entityName, fields }: ImportExportProps) {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      // Fetch all data from the API
      let allData: any[] = []
      let nextUrl = `${endpoint}/`
      
      while (nextUrl) {
        const response = await apiGet(nextUrl)
        if (response.results) {
          allData = [...allData, ...response.results]
          nextUrl = response.next
        } else {
          // Handle non-paginated response
          allData = Array.isArray(response) ? response : [response]
          nextUrl = null
        }
      }

      if (format === 'csv') {
        exportToCSV(allData)
      } else {
        exportToJSON(allData)
      }
      
      toast.success(`${entityName} data exported successfully`)
      setExportDialogOpen(false)
    } catch (error: any) {
      toast.error(`Failed to export ${entityName.toLowerCase()}: ${error.message}`)
    }
    setExporting(false)
  }

  const exportToCSV = (data: any[]) => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    // Use provided fields or extract from first item
    const headers = fields.length > 0 ? fields : Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(item => 
        headers.map(header => {
          const value = item[header]
          // Handle nested objects and arrays
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          }
          // Escape commas and quotes
          return `"${String(value || '').replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    downloadFile(csvContent, `${entityName.toLowerCase()}_export.csv`, 'text/csv')
  }

  const exportToJSON = (data: any[]) => {
    const jsonContent = JSON.stringify(data, null, 2)
    downloadFile(jsonContent, `${entityName.toLowerCase()}_export.json`, 'application/json')
  }

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const fileContent = await readFileContent(file)
      let data: any[]

      if (file.name.endsWith('.json')) {
        data = JSON.parse(fileContent)
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(fileContent)
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON files.')
      }

      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('File must contain an array of objects')
      }

      // Import data in batches
      let successCount = 0
      let errorCount = 0
      const batchSize = 10

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        for (const item of batch) {
          try {
            // Remove id field if present to avoid conflicts
            const { id, ...itemWithoutId } = item
            await apiPost(`${endpoint}/`, itemWithoutId)
            successCount++
          } catch (error) {
            errorCount++
            console.error(`Failed to import item:`, item, error)
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} ${entityName.toLowerCase()} records`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} records. Check console for details.`)
      }
      
      setImportDialogOpen(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`)
    }
    setImporting(false)
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const parseCSV = (csvContent: string): any[] => {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim())
      const item: any = {}
      
      headers.forEach((header, index) => {
        let value = values[index] || ''
        
        // Try to parse JSON for complex fields
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            value = JSON.parse(value)
          } catch {
            // Keep as string if not valid JSON
          }
        }
        
        item[header] = value
      })
      
      data.push(item)
    }

    return data
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImport(file)
    }
  }

  return (
    <div className="flex space-x-2">
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export {entityName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the format for exporting your {entityName.toLowerCase()} data.
            </p>
            <div className="flex space-x-4">
              <Button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{exporting ? 'Exporting...' : 'Export as CSV'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{exporting ? 'Exporting...' : 'Export as JSON'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import {entityName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Important Notes:</p>
                <ul className="mt-1 list-disc list-inside text-yellow-700 space-y-1">
                  <li>Supported formats: CSV and JSON</li>
                  <li>Existing records with the same data may create duplicates</li>
                  <li>Invalid data will be skipped and logged to console</li>
                  <li>Large imports may take some time to process</li>
                </ul>
              </div>
            </div>
            
            <div>
              <Label htmlFor="import-file">Select File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={importing}
                className="mt-2"
              />
            </div>
            
            {importing && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  Importing data, please wait...
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
