import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Input, Alert, LoadingSpinner, Badge, Select } from '@/components/common'
import exerciseService from '@/services/exercise.service'
import submissionService from '@/services/submission.service'
import teamService from '@/services/team.service'
import { Exercise } from '@/types/exercise.types'
import toast from 'react-hot-toast'

const ExerciseDetail = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [teamExerciseId, setTeamExerciseId] = useState<number | null>(null)

  // Submission form state
  const [submissionType, setSubmissionType] = useState<'file' | 'text' | 'url'>('file')
  const [textContent, setTextContent] = useState('')
  const [urlContent, setUrlContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadExercise()
  }, [exerciseId])

  const loadExercise = async () => {
    if (!exerciseId) {
      toast.error('Invalid exercise ID')
      navigate('/participant/exercises')
      return
    }

    try {
      setLoading(true)

      // Load exercise details
      const exerciseData = await exerciseService.getById(parseInt(exerciseId))
      setExercise(exerciseData)

      // Get team to find team_exercise_id
      const myTeam = await teamService.getMyTeam()

      // TODO: This needs to be improved - we need an endpoint to get team_exercise_id
      // For now, we'll construct it as team_id + exercise_id
      // This is a temporary workaround
      setTeamExerciseId(myTeam.id) // This needs proper implementation

    } catch (error: any) {
      console.error('Failed to load exercise:', error)
      toast.error('Failed to load exercise')
      navigate('/participant/exercises')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamExerciseId) {
      toast.error('Cannot submit: Team exercise not found')
      return
    }

    try {
      setSubmitting(true)

      let response
      switch (submissionType) {
        case 'file':
          if (!selectedFile) {
            toast.error('Please select a file to upload')
            return
          }
          response = await submissionService.submitFile(teamExerciseId, selectedFile)
          toast.success('File uploaded successfully! ✅')
          break

        case 'text':
          if (!textContent.trim()) {
            toast.error('Please enter some content')
            return
          }
          response = await submissionService.submitText(teamExerciseId, textContent)
          toast.success('Text submitted successfully! ✅')
          break

        case 'url':
          if (!urlContent.trim()) {
            toast.error('Please enter a URL')
            return
          }
          response = await submissionService.submitUrl(teamExerciseId, urlContent)
          toast.success('URL submitted successfully! ✅')
          break
      }

      // Reset form
      setTextContent('')
      setUrlContent('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Navigate to submissions page
      setTimeout(() => {
        navigate('/participant/submissions')
      }, 1500)

    } catch (error: any) {
      console.error('Failed to submit:', error)
      toast.error(error.response?.data?.error || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading exercise..." />
  }

  if (!exercise) {
    return (
      <Card>
        <Alert variant="error">Exercise not found</Alert>
      </Card>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/participant/exercises')}
          style={{ marginBottom: 'var(--spacing-md)' }}
        >
          ← Back to Exercises
        </Button>

        <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
          {exercise.title}
        </h1>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Badge variant="info">{exercise.type}</Badge>
          <Badge variant="secondary">Max Score: {exercise.max_score} points</Badge>
          {exercise.time_limit_minutes && (
            <Badge variant="warning">⏱️ Time Limit: {exercise.time_limit_minutes} minutes</Badge>
          )}
          {exercise.submission_count !== undefined && (
            <Badge variant="secondary">
              {exercise.submission_count} submission{exercise.submission_count !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Main Content */}
        <div>
          {/* Exercise Description */}
          <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Description</h2>
            <div
              style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {exercise.description}
            </div>
          </Card>

          {/* Instructions */}
          {exercise.instructions && (
            <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Instructions</h2>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {exercise.instructions}
              </div>
            </Card>
          )}

          {/* Submit Work */}
          <Card>
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Submit Your Work</h2>

            <form onSubmit={handleSubmit}>
              {/* Submission Type Selector */}
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: 600, fontSize: 'var(--font-size-base)' }}>
                  Select Submission Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
                  <button
                    type="button"
                    onClick={() => setSubmissionType('file')}
                    style={{
                      padding: 'var(--spacing-lg)',
                      border: `2px solid ${submissionType === 'file' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: submissionType === 'file' ? 'var(--color-bg-primary)' : 'transparent',
                      color: submissionType === 'file' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all var(--transition-fast)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-lg)' }}>File Upload</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7, fontWeight: 'normal' }}>
                      ZIP, PDF, Code Files
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionType('text')}
                    style={{
                      padding: 'var(--spacing-lg)',
                      border: `2px solid ${submissionType === 'text' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: submissionType === 'text' ? 'var(--color-bg-primary)' : 'transparent',
                      color: submissionType === 'text' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all var(--transition-fast)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-lg)' }}>Text Submission</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7, fontWeight: 'normal' }}>
                      Paste Code or Text
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionType('url')}
                    style={{
                      padding: 'var(--spacing-lg)',
                      border: `2px solid ${submissionType === 'url' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: submissionType === 'url' ? 'var(--color-bg-primary)' : 'transparent',
                      color: submissionType === 'url' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all var(--transition-fast)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-lg)' }}>URL Link</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7, fontWeight: 'normal' }}>
                      GitHub, Website, etc.
                    </div>
                  </button>
                </div>
              </div>

              {/* File Upload Form */}
              {submissionType === 'file' && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: 600, fontSize: 'var(--font-size-base)' }}>
                    Choose File to Upload
                  </label>
                  <div style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-xl)',
                    background: 'var(--color-bg-secondary)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      style={{
                        display: 'block',
                        width: '100%',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  {selectedFile && (
                    <div style={{
                      marginTop: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      background: 'var(--color-success-light)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-success)',
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                        File Selected:
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </div>
                    </div>
                  )}
                  <div style={{
                    marginTop: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-tertiary)',
                  }}>
                    <strong>Supported formats:</strong> ZIP archives, source code files, PDF documents, images, etc.
                  </div>
                </div>
              )}

              {/* Text Submission Form */}
              {submissionType === 'text' && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: 600, fontSize: 'var(--font-size-base)' }}>
                    Enter Your Code or Text Solution
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="// Paste your code or text solution here...&#10;&#10;function example() {&#10;  // Your code&#10;}"
                    style={{
                      width: '100%',
                      minHeight: '350px',
                      padding: 'var(--spacing-md)',
                      fontSize: '14px',
                      fontFamily: "'Courier New', Consolas, Monaco, monospace",
                      lineHeight: '1.6',
                      border: '2px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{
                    marginTop: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-tertiary)',
                  }}>
                    <strong>Note:</strong> Paste your complete code, solution, or written response. Formatting and syntax highlighting will be preserved.
                  </div>
                </div>
              )}

              {/* URL Submission Form */}
              {submissionType === 'url' && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: 600, fontSize: 'var(--font-size-base)' }}>
                    Project URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/username/repository"
                    value={urlContent}
                    onChange={(e) => setUrlContent(e.target.value)}
                    required
                  />
                  <div style={{
                    marginTop: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-tertiary)',
                  }}>
                    <div style={{ marginBottom: 'var(--spacing-xs)' }}><strong>Accepted URL types:</strong></div>
                    <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', lineHeight: 1.8 }}>
                      <li>GitHub repositories (public or private with access)</li>
                      <li>Deployed websites and web applications</li>
                      <li>GitLab, Bitbucket, or other code hosting platforms</li>
                      <li>Documentation or project hosting sites</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Work'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          {/* Points */}
          <Card style={{ marginBottom: 'var(--spacing-md)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-xs)' }}>
                Maximum Points
              </div>
              <div className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold' }}>
                {exercise.max_score}
              </div>
            </div>
          </Card>

          {/* Exercise Info */}
          <Card>
            <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
              Exercise Information
            </h3>

            <div style={{ display: 'grid', gap: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
              <div style={{
                padding: 'var(--spacing-sm)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)' }}>
                  Type
                </div>
                <div style={{ fontWeight: 600 }}>
                  {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}
                </div>
              </div>

              {exercise.time_limit_minutes && (
                <div style={{
                  padding: 'var(--spacing-sm)',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)' }}>
                    Time Limit
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {exercise.time_limit_minutes} minutes
                  </div>
                </div>
              )}

              <div style={{
                padding: 'var(--spacing-sm)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)' }}>
                  Status
                </div>
                <Badge variant={exercise.status === 'active' ? 'success' : 'secondary'}>
                  {exercise.status.charAt(0).toUpperCase() + exercise.status.slice(1)}
                </Badge>
              </div>
            </div>

            {exercise.rubric && (
              <>
                <div className="divider" style={{ margin: 'var(--spacing-lg) 0' }}></div>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-md)', fontWeight: 600 }}>
                    Grading Criteria
                  </h4>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    {exercise.rubric}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExerciseDetail
