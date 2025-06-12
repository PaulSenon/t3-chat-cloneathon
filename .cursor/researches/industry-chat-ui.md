# Industry-Standard Chat UI Components

**Production-ready patterns from leading chat applications**

[← Back to Overview](./README.md)

## Overview

Analysis of UI patterns used by ChatGPT, Claude, Discord, Slack, and other leading chat applications. This guide provides production-ready components for building competitive chat experiences.

## 🎨 Component Categories

| Category | Examples | Usage | Implementation Complexity |
|----------|----------|-------|---------------------------|
| **Text Display** | Code blocks, math, tables | Universal | ⭐⭐ Medium |
| **Interactive Widgets** | Charts, maps, forms | High engagement | ⭐⭐⭐ High |
| **Media Components** | Images, videos, files | Rich content | ⭐⭐ Medium |
| **Workflow UI** | Multi-step, progress, actions | Complex tasks | ⭐⭐⭐⭐ Very High |

## 1. Code Block Components

### Syntax Highlighting with Copy & Run Actions

> **Used by**: ChatGPT, Claude, GitHub Copilot, Cursor

```typescript
// components/ui/code-block.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  allowRun?: boolean;
  explanation?: string;
}

export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = true,
  allowRun = false,
  explanation,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    if (!allowRun) return;
    
    setIsRunning(true);
    try {
      // Integration with code execution service
      const result = await executeCode(code, language);
      setOutput(result.output);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
          {filename && (
            <span className="text-gray-300 ml-2">{filename}</span>
          )}
          <span className="text-gray-400 text-xs uppercase">{language}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {allowRun && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs"
            >
              {isRunning ? (
                <Spinner className="w-3 h-3" />
              ) : (
                <PlayIcon className="w-3 h-3" />
              )}
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs"
          >
            {copied ? (
              <CheckIcon className="w-3 h-3" />
            ) : (
              <CopyIcon className="w-3 h-3" />
            )}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Content */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: 'transparent',
        }}
      >
        {code}
      </SyntaxHighlighter>

      {/* Code Execution Output */}
      {output && (
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-2">Output:</div>
          <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">
            {output}
          </pre>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="border-t border-gray-200 bg-blue-50 p-4">
          <div className="text-sm text-blue-800">{explanation}</div>
        </div>
      )}
    </div>
  );
}

// Usage with AI SDK
const codeBlockTool = {
  displayCode: {
    description: "Display code with syntax highlighting and execution",
    parameters: z.object({
      code: z.string(),
      language: z.string(),
      filename: z.string().optional(),
      explanation: z.string().optional(),
      executable: z.boolean().default(false),
    }),
    execute: async ({ code, language, filename, explanation, executable }) => {
      return {
        code,
        language,
        filename,
        explanation,
        allowRun: executable && ['javascript', 'python', 'sql'].includes(language),
      };
    },
  },
};

// Code execution service integration
async function executeCode(code: string, language: string) {
  // Integration with services like CodeSandbox API, Judge0, or custom runners
  const response = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  
  return response.json();
}
```

## 2. Interactive Charts & Visualizations

### Dynamic Chart Components

> **Used by**: ChatGPT (Advanced Data Analysis), Claude (Artifacts), Perplexity

```typescript
// components/ui/chart-widget.tsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ChartWidgetProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData[];
  title: string;
  description?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
}

export function ChartWidget({
  type,
  data,
  title,
  description,
  xAxisKey = 'name',
  yAxisKey = 'value',
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'],
}: ChartWidgetProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0] }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yAxisKey} fill={colors[0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yAxisKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Actions */}
      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => downloadChart('png')}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Download PNG
        </button>
        <button
          onClick={() => downloadChart('svg')}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Download SVG
        </button>
        <button
          onClick={() => exportData()}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Export Data
        </button>
      </div>
    </div>
  );
}

// AI SDK Tool Integration
const chartTool = {
  createChart: {
    description: "Create interactive charts from data",
    parameters: z.object({
      type: z.enum(['line', 'bar', 'pie', 'area']),
      data: z.array(z.object({
        name: z.string(),
        value: z.number(),
      })),
      title: z.string(),
      description: z.string().optional(),
    }),
    execute: async ({ type, data, title, description }) => {
      return { type, data, title, description };
    },
  },
};
```

## 3. Table Components with Sorting & Filtering

### Data Table with Advanced Features

> **Used by**: ChatGPT (data analysis), Notion AI, Linear

```typescript
// components/ui/data-table.tsx
import { useState, useMemo } from 'react';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  title?: string;
  searchable?: boolean;
  exportable?: boolean;
  maxRows?: number;
}

export function DataTable({
  data,
  columns,
  title,
  searchable = true,
  exportable = true,
  maxRows = 100,
}: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search filter
    if (search) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Sort
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered.slice(0, maxRows);
  }, [data, search, sortColumn, sortDirection, maxRows]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const csv = [
      columns.map(col => col.label).join(','),
      ...filteredData.map(row =>
        columns.map(col => `"${row[col.key] || ''}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}.csv`;
    a.click();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            <p className="text-sm text-gray-600 mt-1">
              {filteredData.length} rows
              {data.length > maxRows && ` (showing first ${maxRows})`}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {searchable && (
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search table..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {exportable && (
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon
                          className={`w-3 h-3 ${
                            sortColumn === column.key && sortDirection === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDownIcon
                          className={`w-3 h-3 -mt-1 ${
                            sortColumn === column.key && sortDirection === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// AI SDK Tool Integration
const tableTool = {
  displayTable: {
    description: "Display data in an interactive table",
    parameters: z.object({
      data: z.array(z.record(z.any())),
      columns: z.array(z.object({
        key: z.string(),
        label: z.string(),
        sortable: z.boolean().default(true),
      })),
      title: z.string().optional(),
    }),
    execute: async ({ data, columns, title }) => {
      return { data, columns, title };
    },
  },
};
```

## 4. Multi-Step Workflow Components

### Guided Process UI

> **Used by**: ChatGPT (plugin workflows), Claude (complex tasks), GitHub Copilot (code generation)

```typescript
// components/ui/workflow-stepper.tsx
interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  result?: any;
  error?: string;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowSkip?: boolean;
}

export function WorkflowStepper({
  steps,
  currentStep,
  onStepClick,
  allowSkip = false,
}: WorkflowStepperProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Workflow Progress</h3>
        <span className="text-sm text-gray-600">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            {/* Step Indicator */}
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : step.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-800'
                    : step.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {step.status === 'completed' ? (
                  <CheckIcon className="w-4 h-4" />
                ) : step.status === 'in-progress' ? (
                  <Spinner className="w-4 h-4" />
                ) : step.status === 'error' ? (
                  <XIcon className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div
                className={`cursor-pointer ${
                  onStepClick && (allowSkip || index <= currentStep)
                    ? 'hover:text-blue-600'
                    : ''
                }`}
                onClick={() =>
                  onStepClick &&
                  (allowSkip || index <= currentStep) &&
                  onStepClick(index)
                }
              >
                <h4 className="text-sm font-medium text-gray-900">
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Step Result */}
              {step.result && (
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <StepResult result={step.result} />
                </div>
              )}

              {/* Error Display */}
              {step.error && (
                <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-sm text-red-800">{step.error}</p>
                </div>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute left-4 mt-8 w-px h-4 bg-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Usage with streaming workflows
const workflowTool = {
  executeWorkflow: {
    description: "Execute a multi-step workflow",
    parameters: z.object({
      workflowType: z.string(),
      steps: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
      })),
    }),
    execute: async function* ({ workflowType, steps }) {
      const workflowSteps = steps.map(step => ({
        ...step,
        status: 'pending' as const,
      }));

      // Yield initial state
      yield { steps: workflowSteps, currentStep: 0 };

      // Execute each step
      for (let i = 0; i < steps.length; i++) {
        workflowSteps[i].status = 'in-progress';
        yield { steps: [...workflowSteps], currentStep: i };

        try {
          // Execute step logic
          const result = await executeWorkflowStep(steps[i], workflowType);
          
          workflowSteps[i].status = 'completed';
          workflowSteps[i].result = result;
        } catch (error) {
          workflowSteps[i].status = 'error';
          workflowSteps[i].error = error.message;
          break;
        }

        yield { steps: [...workflowSteps], currentStep: i };
      }

      return { steps: workflowSteps, currentStep: steps.length - 1 };
    },
  },
};
```

## 5. File & Media Components

### File Upload & Preview

> **Used by**: ChatGPT (file uploads), Claude (document analysis), Discord

```typescript
// components/ui/file-widget.tsx
interface FileInfo {
  name: string;
  size: number;
  type: string;
  url?: string;
  content?: string;
  metadata?: Record<string, any>;
}

interface FileWidgetProps {
  file: FileInfo;
  showPreview?: boolean;
  allowDownload?: boolean;
  actions?: Array<{
    label: string;
    action: (file: FileInfo) => void;
    icon?: React.ReactNode;
  }>;
}

export function FileWidget({
  file,
  showPreview = true,
  allowDownload = true,
  actions = [],
}: FileWidgetProps) {
  const [previewMode, setPreviewMode] = useState<'none' | 'text' | 'image' | 'pdf'>('none');

  useEffect(() => {
    if (showPreview) {
      if (file.type.startsWith('image/')) {
        setPreviewMode('image');
      } else if (file.type.startsWith('text/') || file.content) {
        setPreviewMode('text');
      } else if (file.type === 'application/pdf') {
        setPreviewMode('pdf');
      }
    }
  }, [file.type, file.content, showPreview]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return <ImageIcon />;
    if (file.type.includes('pdf')) return <DocumentIcon />;
    if (file.type.startsWith('text/')) return <DocumentTextIcon />;
    return <DocumentIcon />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* File Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-3">
          <div className="text-gray-500">
            {getFileIcon()}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
            <p className="text-xs text-gray-600">
              {formatFileSize(file.size)} • {file.type}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.action(file)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
          
          {allowDownload && file.url && (
            <a
              href={file.url}
              download={file.name}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Download"
            >
              <DownloadIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* File Preview */}
      {previewMode !== 'none' && (
        <div className="p-4">
          {previewMode === 'image' && file.url && (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full h-auto rounded"
            />
          )}

          {previewMode === 'text' && file.content && (
            <pre className="text-sm text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {file.content}
            </pre>
          )}

          {previewMode === 'pdf' && file.url && (
            <iframe
              src={file.url}
              className="w-full h-96 border rounded"
              title={file.name}
            />
          )}
        </div>
      )}

      {/* File Metadata */}
      {file.metadata && Object.keys(file.metadata).length > 0 && (
        <div className="border-t p-4 bg-gray-50">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Metadata</h5>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(file.metadata).map(([key, value]) => (
              <div key={key}>
                <dt className="text-gray-600 capitalize">{key}:</dt>
                <dd className="text-gray-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

// AI SDK Tool Integration
const fileTool = {
  analyzeFile: {
    description: "Analyze and display file information",
    parameters: z.object({
      file: z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        content: z.string().optional(),
        url: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
      analysis: z.string().optional(),
    }),
    execute: async ({ file, analysis }) => {
      return {
        file,
        analysis,
        actions: [
          {
            label: 'Summarize',
            action: () => console.log('Summarizing file...'),
            icon: <SummaryIcon />,
          },
          {
            label: 'Extract Text',
            action: () => console.log('Extracting text...'),
            icon: <TextIcon />,
          },
        ],
      };
    },
  },
};
```

## Implementation Integration

### Complete Chat Component with All Widgets

```typescript
// components/advanced-chat.tsx
export function AdvancedChat() {
  const { messages } = useChat({
    api: '/api/chat',
    // All tools available
  });

  return (
    <div className="max-w-4xl mx-auto">
      {messages.map(message => (
        <div key={message.id} className="mb-6">
          <div className="prose max-w-none">{message.content}</div>

          {/* Render all widget types */}
          {message.toolInvocations?.map(tool => {
            if (tool.state === 'result') {
              switch (tool.toolName) {
                case 'displayCode':
                  return <CodeBlock key={tool.toolCallId} {...tool.result} />;
                
                case 'createChart':
                  return <ChartWidget key={tool.toolCallId} {...tool.result} />;
                
                case 'displayTable':
                  return <DataTable key={tool.toolCallId} {...tool.result} />;
                
                case 'executeWorkflow':
                  return <WorkflowStepper key={tool.toolCallId} {...tool.result} />;
                
                case 'analyzeFile':
                  return <FileWidget key={tool.toolCallId} {...tool.result} />;
                
                default:
                  return <div key={tool.toolCallId}>Unknown tool: {tool.toolName}</div>;
              }
            }
            
            return <WidgetSkeleton key={tool.toolCallId} type={tool.toolName} />;
          })}
        </div>
      ))}
    </div>
  );
}
```

## 📚 References & Sources

### Component Libraries
- **[Recharts](https://recharts.org/)** - React chart library
- **[React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)** - Code highlighting
- **[Headless UI](https://headlessui.com/)** - Accessible components
- **[Radix UI](https://www.radix-ui.com/)** - Low-level UI primitives

### Design Systems
- **[GitHub Primer](https://primer.style/)** - GitHub's design system
- **[Slack Design](https://design.slack.com/)** - Slack's component patterns
- **[Discord Design](https://discord.com/branding)** - Discord's visual language

### Code Execution Services
- **[CodeSandbox API](https://codesandbox.io/docs/api)** - Browser-based code execution
- **[Judge0 API](https://judge0.com/)** - Code execution engine
- **[Replit API](https://docs.replit.com/misc/replit-api)** - Online IDE integration

### File Processing
- **[PDF.js](https://mozilla.github.io/pdf.js/)** - PDF rendering
- **[React PDF](https://react-pdf.org/)** - PDF generation
- **[Sharp](https://sharp.pixelplumbing.com/)** - Image processing

---

**Next Steps**: Choose the components most relevant to your use case and integrate them with your [Rich Streaming](./rich-streaming.md) implementation. 