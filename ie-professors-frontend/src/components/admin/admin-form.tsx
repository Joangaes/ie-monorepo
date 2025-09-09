"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiGet, apiPatch, apiPost } from "@/lib/api"
import { toast } from "react-hot-toast"
import { ArrowLeft, Save } from "lucide-react"
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete"

export interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'email' | 'number' | 'boolean' | 'select' | 'multi-select' | 'foreign-key' | 'date'
  options?: Array<{ value: string; label: string }>
  foreignKeyConfig?: {
    endpoint: string
    displayField: string
    valueField: string
  }
  required?: boolean
  readonly?: boolean
  defaultValue?: any
}

interface AdminFormProps {
  title: string
  endpoint: string
  fields: FieldConfig[]
  recordId?: string // If provided, this is an edit form, otherwise it's an add form
  backPath: string
  entityName: string
}

export function AdminForm({
  title,
  endpoint,
  fields,
  recordId,
  backPath,
  entityName,
}: AdminFormProps) {
  const [record, setRecord] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [foreignKeyData, setForeignKeyData] = useState<Record<string, any[]>>({})
  const router = useRouter()

  // Helper function to convert objects to autocomplete options with enhanced display
  const createAutocompleteOptions = (objects: any[], endpoint: string): AutocompleteOption[] => {
    return objects.map(obj => {
      // Special handling for professors to show full name
      if (endpoint.includes('/professors')) {
        const fullName = `${obj.name || ''} ${obj.last_name || ''}`.trim()
        return {
          value: obj.id,
          label: fullName || obj.name || 'Unknown Professor',
          subtitle: obj.corporate_email || obj.email,
          searchText: `${fullName} ${obj.email || ''} ${obj.corporate_email || ''} ${obj.professor_type || ''}`.toLowerCase()
        }
      }
      
      // Special handling for courses to show code and name
      if (endpoint.includes('/courses')) {
        return {
          value: obj.id,
          label: `${obj.code || ''} - ${obj.name || ''}`.replace(/^- /, ''),
          subtitle: obj.area?.name || obj.course_type_display,
          searchText: `${obj.code || ''} ${obj.name || ''} ${obj.area?.name || ''}`.toLowerCase()
        }
      }
      
      // Special handling for degrees to show degree and university
      if (endpoint.includes('/degrees')) {
        return {
          value: obj.id,
          label: obj.name || 'Unknown Degree',
          subtitle: obj.university?.name || 'Unknown University',
          searchText: `${obj.name || ''} ${obj.university?.name || ''} ${obj.degree_type_display || ''}`.toLowerCase()
        }
      }
      
      // Default handling for other foreign keys
      return {
        value: obj.id,
        label: obj.name || obj.title || obj.label || 'Unknown',
        searchText: Object.values(obj).filter(val => typeof val === 'string').join(' ').toLowerCase()
      }
    })
  }

  const isEdit = !!recordId

  // Load record data for edit mode
  useEffect(() => {
    if (isEdit && recordId) {
      loadRecord()
    } else {
      // Initialize with default values for add mode
      const defaultRecord: Record<string, any> = {}
      fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaultRecord[field.key] = field.defaultValue
        }
      })
      setRecord(defaultRecord)
    }
  }, [recordId, isEdit])

  // Load foreign key options
  useEffect(() => {
    loadForeignKeyData()
  }, [])

  const loadRecord = async () => {
    setLoading(true)
    try {
      const data = await apiGet(`${endpoint}/${recordId}/`)
      setRecord(data)
    } catch (error: any) {
      toast.error(`Failed to load ${entityName.toLowerCase()}: ${error.message}`)
      router.push(backPath)
    }
    setLoading(false)
  }

  const loadForeignKeyData = async () => {
    const foreignKeyFields = fields.filter(f => f.type === 'foreign-key' && f.foreignKeyConfig)
    
    for (const field of foreignKeyFields) {
      if (!field.foreignKeyConfig) continue
      
      try {
        const data = await apiGet(`${field.foreignKeyConfig.endpoint}/`)
        setForeignKeyData(prev => ({
          ...prev,
          [field.key]: data.results || data
        }))
      } catch (error) {
        console.error(`Failed to load options for ${field.key}:`, error)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Convert foreign key fields to _id format for API
      const payload = { ...record }
      
      // Convert foreign key fields based on endpoint
      if (endpoint.includes('/courses')) {
        if (payload.area) {
          payload.area_id = payload.area
          delete payload.area
        }
      } else if (endpoint.includes('/sections')) {
        if (payload.intake) {
          payload.intake_id = payload.intake
          delete payload.intake
        }
        if (payload.program) {
          payload.program_id = payload.program
          delete payload.program
        }
        if (payload.joined_academic_year) {
          payload.joined_academic_year_id = payload.joined_academic_year
          delete payload.joined_academic_year
        }
      } else if (endpoint.includes('/degrees')) {
        if (payload.university) {
          payload.university_id = payload.university
          delete payload.university
        }
      }
      
      if (isEdit) {
        await apiPatch(`${endpoint}/${recordId}/`, payload)
        toast.success(`${entityName} updated successfully`)
      } else {
        await apiPost(`${endpoint}/`, payload)
        toast.success(`${entityName} created successfully`)
      }
      router.push(backPath)
    } catch (error: any) {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} ${entityName.toLowerCase()}: ${error.message}`)
    }
    setSaving(false)
  }

  const handleFieldChange = (key: string, value: any) => {
    setRecord(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const renderField = (field: FieldConfig) => {
    const value = record[field.key]

    if (field.type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={field.key}
            checked={Boolean(value)}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            disabled={field.readonly}
            className="h-4 w-4"
          />
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <select
            id={field.key}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={field.readonly}
            className="w-full p-2 border rounded-md"
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (field.type === 'multi-select') {
      const selectedValues = Array.isArray(value) ? value : []
      
      return (
        <div className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id={`${field.key}_${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value)
                    handleFieldChange(field.key, newValues)
                  }}
                  disabled={field.readonly}
                  className="h-4 w-4"
                />
                <Label htmlFor={`${field.key}_${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Selected: {selectedValues.join(', ')}
            </div>
          )}
        </div>
      )
    }

    if (field.type === 'foreign-key') {
      const relatedObjects = foreignKeyData[field.key] || []
      
      // Convert objects to autocomplete options with enhanced display
      const autocompleteOptions = createAutocompleteOptions(relatedObjects, field.foreignKeyConfig!.endpoint)

      return (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Autocomplete
                id={field.key}
                label={field.label}
                value={value || ''}
                onChange={(newValue) => handleFieldChange(field.key, newValue)}
                options={autocompleteOptions}
                placeholder={`Search ${field.label.toLowerCase()}...`}
                required={field.required}
                disabled={field.readonly}
                loading={relatedObjects.length === 0}
              />
            </div>
            {value && (
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const relatedEndpoint = field.foreignKeyConfig!.endpoint.split('/').pop()
                    router.push(`/${relatedEndpoint}/${value}/edit`)
                  }}
                  className="h-10"
                >
                  View
                </Button>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={field.key}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          id={field.key}
          type={field.type}
          value={value || ''}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          disabled={field.readonly}
          required={field.required}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(backPath)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">
              {isEdit ? `Edit ${entityName.toLowerCase()}` : `Create a new ${entityName.toLowerCase()}`}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit' : 'Add'} {entityName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map(field => (
                  <div key={field.key} className={field.type === 'boolean' ? 'md:col-span-2' : ''}>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(backPath)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
