"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api"
import { toast } from "react-hot-toast"
import { ArrowLeft, Save, Plus, Edit, Trash2 } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
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
  tab?: string // New property to specify which tab this field belongs to
}

export interface TabConfig {
  key: string
  label: string
  fields: string[] // Field keys that belong to this tab
}

export interface InlineConfig {
  key: string
  label: string
  endpoint: string
  fields: FieldConfig[]
  foreignKeyField: string // The field that links back to the parent record
  tab: string // Which tab this inline belongs to
}

interface AdminTabbedFormProps {
  title: string
  endpoint: string
  fields: FieldConfig[]
  tabs: TabConfig[]
  inlines?: InlineConfig[]
  recordId?: string // If provided, this is an edit form, otherwise it's an add form
  backPath: string
  entityName: string
}

export function AdminTabbedForm({
  title,
  endpoint,
  fields,
  tabs,
  inlines = [],
  recordId,
  backPath,
  entityName,
}: AdminTabbedFormProps) {
  const { t } = useTranslations()
  const [record, setRecord] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [foreignKeyData, setForeignKeyData] = useState<Record<string, any[]>>({})
  const [inlineData, setInlineData] = useState<Record<string, any[]>>({})
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || '')
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
      loadInlineData()
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
      
      // Convert foreign key objects to IDs for form compatibility
      const processedData = { ...data }
      fields.forEach(field => {
        if (field.type === 'foreign-key' && processedData[field.key]) {
          // If the field value is an object, extract the ID
          if (typeof processedData[field.key] === 'object' && processedData[field.key].id) {
            processedData[field.key] = processedData[field.key].id.toString()
          }
        }
      })
      
      setRecord(processedData)
    } catch (error: any) {
      toast.error(`Failed to load ${entityName.toLowerCase()}: ${error.message}`)
      router.push(backPath)
    }
    setLoading(false)
  }

  const loadForeignKeyData = async () => {
    const foreignKeyFields = fields.filter(f => f.type === 'foreign-key' && f.foreignKeyConfig)
    
    // Also include foreign key fields from inlines
    const inlineForeignKeyFields: FieldConfig[] = []
    inlines.forEach(inline => {
      inline.fields.forEach(field => {
        if (field.type === 'foreign-key' && field.foreignKeyConfig) {
          inlineForeignKeyFields.push(field)
        }
      })
    })
    
    const allForeignKeyFields = [...foreignKeyFields, ...inlineForeignKeyFields]
    
    for (const field of allForeignKeyFields) {
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

  const loadInlineData = async () => {
    for (const inline of inlines) {
      try {
        let queryParam = `${inline.foreignKeyField}=${recordId}`
        
        // Special handling for course deliveries with sections
        if (inline.endpoint.includes('course-deliveries') && inline.foreignKeyField === 'sections__in') {
          queryParam = `sections__in=${recordId}`
        }
        
        const data = await apiGet(`${inline.endpoint}/?${queryParam}`)
        setInlineData(prev => ({
          ...prev,
          [inline.key]: data.results || data
        }))
      } catch (error) {
        console.error(`Failed to load inline data for ${inline.key}:`, error)
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

  const handleInlineAdd = (inlineKey: string) => {
    setInlineData(prev => ({
      ...prev,
      [inlineKey]: [...(prev[inlineKey] || []), { isNew: true, isEditing: true }]
    }))
  }

  const handleInlineEdit = (inlineKey: string, index: number) => {
    setInlineData(prev => ({
      ...prev,
      [inlineKey]: prev[inlineKey].map((item, i) => 
        i === index ? { ...item, isEditing: true, originalData: { ...item } } : item
      )
    }))
  }

  const handleInlineCancel = (inlineKey: string, index: number) => {
    setInlineData(prev => {
      const newData = [...prev[inlineKey]]
      if (newData[index].isNew) {
        // Remove new item
        newData.splice(index, 1)
      } else {
        // Restore original data
        newData[index] = { ...newData[index].originalData, isEditing: false }
        delete newData[index].originalData
      }
      return { ...prev, [inlineKey]: newData }
    })
  }

  const handleInlineSave = async (inlineKey: string, index: number) => {
    const inline = inlines.find(i => i.key === inlineKey)
    if (!inline) return

    const item = inlineData[inlineKey][index]
    const { isNew, isEditing, originalData, ...dataToSave } = item

    try {
      if (isNew) {
        // Create new record - use _id fields for foreign keys
        const payload = { ...dataToSave }
        
        // Convert foreign key fields to _id format
        if (inline.endpoint.includes('professor-degrees')) {
          payload.professor_id = recordId
          if (payload.degree) {
            payload.degree_id = payload.degree
            delete payload.degree
          }
        } else if (inline.endpoint.includes('professor-course-possibilities')) {
          payload.professor_id = recordId
          if (payload.course) {
            payload.course_id = payload.course
            delete payload.course
          }
        } else if (inline.endpoint.includes('course-deliveries')) {
          if (payload.professor) {
            payload.professor = payload.professor
          }
          if (payload.course) {
            payload.course = payload.course
          }
          if (inline.foreignKeyField === 'sections__in') {
            payload.sections = [recordId]
          } else if (inline.foreignKeyField === 'professor') {
            payload.professor = recordId
          } else if (inline.foreignKeyField === 'course') {
            payload.course = recordId
          }
        } else {
          // Default behavior for other inlines
          payload[inline.foreignKeyField] = recordId
        }
        
        const response = await apiPost(`${inline.endpoint}/`, payload)
        
        setInlineData(prev => ({
          ...prev,
          [inlineKey]: prev[inlineKey].map((item, i) => 
            i === index ? { ...response, isEditing: false } : item
          )
        }))
        toast.success(`${inline.label} added successfully`)
      } else {
        // Update existing record - use _id fields for foreign keys
        const payload = { ...dataToSave }
        
        // Convert foreign key fields to _id format for updates
        if (inline.endpoint.includes('professor-degrees')) {
          if (payload.degree) {
            payload.degree_id = payload.degree
            delete payload.degree
          }
        } else if (inline.endpoint.includes('professor-course-possibilities')) {
          if (payload.course) {
            payload.course_id = payload.course
            delete payload.course
          }
        } else if (inline.endpoint.includes('course-deliveries')) {
          // For course deliveries, keep the foreign keys as they are
          // The API expects 'course' and 'professor', not 'course_id' and 'professor_id'
        }
        
        await apiPatch(`${inline.endpoint}/${item.id}/`, payload)
        
        setInlineData(prev => ({
          ...prev,
          [inlineKey]: prev[inlineKey].map((item, i) => 
            i === index ? { ...dataToSave, id: item.id, isEditing: false } : item
          )
        }))
        toast.success(`${inline.label} updated successfully`)
      }
    } catch (error: any) {
      toast.error(`Failed to save ${inline.label.toLowerCase()}: ${error.message}`)
    }
  }

  const handleInlineDelete = async (inlineKey: string, index: number) => {
    const inline = inlines.find(i => i.key === inlineKey)
    if (!inline) return

    const item = inlineData[inlineKey][index]
    
    if (item.isNew) {
      // Just remove from local state
      setInlineData(prev => ({
        ...prev,
        [inlineKey]: prev[inlineKey].filter((_, i) => i !== index)
      }))
      return
    }

    if (!confirm(`Are you sure you want to delete this ${inline.label.toLowerCase()}?`)) {
      return
    }

    try {
      await apiDelete(`${inline.endpoint}/${item.id}/`)
      setInlineData(prev => ({
        ...prev,
        [inlineKey]: prev[inlineKey].filter((_, i) => i !== index)
      }))
      toast.success(`${inline.label} deleted successfully`)
    } catch (error: any) {
      toast.error(`Failed to delete ${inline.label.toLowerCase()}: ${error.message}`)
    }
  }

  const handleInlineFieldChange = (inlineKey: string, index: number, fieldKey: string, value: any) => {
    setInlineData(prev => ({
      ...prev,
      [inlineKey]: prev[inlineKey].map((item, i) => 
        i === index ? { ...item, [fieldKey]: value } : item
      )
    }))
  }

  const renderInlineField = (field: FieldConfig, value: any, onChange: (value: any) => void, readonly: boolean = false) => {
    if (field.type === 'select') {
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readonly}
          className="w-full p-1 border rounded text-sm"
        >
          <option value="">Select...</option>
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'foreign-key') {
      const relatedObjects = foreignKeyData[field.key] || []
      
      // Convert objects to autocomplete options with enhanced display
      const autocompleteOptions = createAutocompleteOptions(relatedObjects, field.foreignKeyConfig!.endpoint)

      return (
        <div className="w-full">
          <Autocomplete
            value={value || ''}
            onChange={onChange}
            options={autocompleteOptions}
            placeholder={`Search ${field.label.toLowerCase()}...`}
            disabled={readonly}
            label=""
            className="[&>div:first-child]:hidden" // Hide the label since we're in a table
          />
        </div>
      )
    }

    return (
      <input
        type={field.type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={readonly}
        className="w-full p-1 border rounded text-sm"
      />
    )
  }

  const renderInlineTable = (inline: InlineConfig) => {
    const data = inlineData[inline.key] || []
    
    return (
      <div className="border rounded-md">
        <div className="flex items-center justify-between p-4 border-b bg-muted/20">
          <h4 className="font-medium">{inline.label}</h4>
          <Button
            type="button"
            size="sm"
            onClick={() => handleInlineAdd(inline.key)}
            className="flex items-center space-x-1"
          >
            <Plus className="h-3 w-3" />
            <span>Add {inline.label.slice(0, -1)}</span>
          </Button>
        </div>
        
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {inline.label.toLowerCase()} found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {inline.fields.map(field => (
                    <th key={field.key} className="px-4 py-2 text-left font-medium text-sm">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-t">
                    {inline.fields.map(field => (
                      <td key={field.key} className="px-4 py-2">
                        {item.isEditing ? (
                          renderInlineField(
                            field, 
                            item[field.key], 
                            (value) => handleInlineFieldChange(inline.key, index, field.key, value)
                          )
                        ) : (
                          <span className="text-sm">
                            {field.type === 'foreign-key' ? (
                              // Display the related object name
                              (() => {
                                const fieldValue = item[field.key]
                                
                                // Handle if the field value is an object (from API response)
                                if (typeof fieldValue === 'object' && fieldValue !== null) {
                                  return fieldValue[field.foreignKeyConfig!.displayField] || 
                                         fieldValue.name || 
                                         fieldValue.title || 
                                         JSON.stringify(fieldValue)
                                }
                                
                                // Handle if it's just an ID, try to find in foreignKeyData
                                const relatedObjects = foreignKeyData[field.key] || []
                                const relatedObj = relatedObjects.find(obj => 
                                  obj[field.foreignKeyConfig!.valueField] == fieldValue
                                )
                                return relatedObj ? relatedObj[field.foreignKeyConfig!.displayField] : fieldValue || '-'
                              })()
                            ) : (
                              // Handle other field types, ensure we're not rendering objects
                              (() => {
                                const fieldValue = item[field.key]
                                if (typeof fieldValue === 'object' && fieldValue !== null) {
                                  return JSON.stringify(fieldValue)
                                }
                                return fieldValue || '-'
                              })()
                            )}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex items-center space-x-1">
                        {item.isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleInlineSave(inline.key, index)}
                              className="h-6 px-2 text-xs"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleInlineCancel(inline.key, index)}
                              className="h-6 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleInlineEdit(inline.key, index)}
                              className="h-6 px-2 text-xs"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleInlineDelete(inline.key, index)}
                              className="h-6 px-2 text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(backPath)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.back')}</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">
              {isEdit ? `${t('common.edit')} ${entityName.toLowerCase()}` : `${t('common.add')} ${entityName.toLowerCase()}`}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? t('common.edit') : t('common.add')} {entityName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex w-full justify-start">
                  {tabs.map(tab => (
                    <TabsTrigger key={tab.key} value={tab.key}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {tabs.map(tab => (
                  <TabsContent key={tab.key} value={tab.key} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tab.fields.map(fieldKey => {
                        const field = fields.find(f => f.key === fieldKey)
                        if (!field) return null
                        return (
                          <div key={field.key} className={field.type === 'boolean' ? 'md:col-span-2' : ''}>
                            {renderField(field)}
                          </div>
                        )
                      })}
                    </div>

                    {/* Render inlines for this tab */}
                    {isEdit && inlines.filter(inline => inline.tab === tab.key).map(inline => (
                      <div key={inline.key} className="space-y-4">
                        <h3 className="text-lg font-semibold">{inline.label}</h3>
                        {renderInlineTable(inline)}
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(backPath)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? t('common.saving') : (isEdit ? t('common.save') : t('common.add'))}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
