// src/App.js
import React, { useState, useCallback } from "react";
import "./App.css";

import { QuestionPool } from "./Questionpool";
import { SurveyPreview } from "./SurveyPreview";

const initialSurveyState = {
  title: "XLS Form Compatible Survey",
  description: "A survey built with XLS form compatible question types",
  pages: [{ name: "page1", elements: [] }],
};

function App() {
  const [surveyJson, setSurveyJson] = useState(initialSurveyState);
  const [surveyData, setSurveyData] = useState({});
  const [surveyKey, setSurveyKey] = useState(0);
  // Hidden metadata storage - not shown to user
  const [surveyMetadata, setSurveyMetadata] = useState({
    createdAt: new Date().toISOString(),
    lastModified: null,
    totalBundlesAdded: 0,
    bundleHistory: [],
    questionAdditionLog: [],
    surveyBuildDuration: 0,
    startBuildTime: new Date().getTime()
  });

  // Enhanced function to add questions with better duplicate handling and metadata tracking
  const addQuestionsToSurvey = useCallback((schemasToAdd) => {
    const currentElements = [...surveyJson.pages[0].elements];
    let questionsAdded = 0;
    const duplicateNames = [];
    const addedQuestionNames = [];

    schemasToAdd.forEach(schema => {
      const questionExists = currentElements.some(
        (element) => element.name === schema.name
      );

      if (!questionExists) {
        // Create a deep copy of the schema to avoid reference issues
        const newSchema = JSON.parse(JSON.stringify(schema));
        
        // Special handling for dynamic panels - ensure proper initialization
        if (newSchema.type === 'paneldynamic') {
          // Make sure panelCount is properly set
          if (newSchema.panelCount === undefined) {
            newSchema.panelCount = 0;
          }
          // Ensure proper panel management properties
          if (newSchema.allowAddPanel === undefined) {
            newSchema.allowAddPanel = true;
          }
          if (newSchema.allowRemovePanel === undefined) {
            newSchema.allowRemovePanel = true;
          }
        }
        
        currentElements.push(newSchema);
        questionsAdded++;
        addedQuestionNames.push(schema.name);
      } else {
        duplicateNames.push(schema.name);
      }
    });
    
    if (questionsAdded === 0) {
      alert(`This feature (or all of its questions) is already in the survey.\nDuplicate questions: ${duplicateNames.join(', ')}`);
      return;
    }

    if (duplicateNames.length > 0) {
      alert(`Added ${questionsAdded} new questions. Skipped duplicates: ${duplicateNames.join(', ')}`);
    }

    const newSurveyJson = {
      ...surveyJson,
      pages: [{ ...surveyJson.pages[0], elements: currentElements }],
    };
    setSurveyJson(newSurveyJson);

    // Update metadata (hidden from user)
    const currentTime = new Date().toISOString();
    setSurveyMetadata(prev => ({
      ...prev,
      lastModified: currentTime,
      totalBundlesAdded: prev.totalBundlesAdded + 1,
      bundleHistory: [
        ...prev.bundleHistory,
        {
          timestamp: currentTime,
          questionsAdded: addedQuestionNames,
          questionCount: questionsAdded,
          totalQuestionsInSurvey: currentElements.length
        }
      ],
      questionAdditionLog: [
        ...prev.questionAdditionLog,
        ...addedQuestionNames.map(name => ({
          questionName: name,
          addedAt: currentTime,
          bundleNumber: prev.totalBundlesAdded + 1
        }))
      ]
    }));

    // Auto-scroll to the newly added question(s) after a short delay
    setTimeout(() => {
      if (addedQuestionNames.length > 0) {
        // Try to find the first newly added question in the DOM
        const firstNewQuestionName = addedQuestionNames[0];
        let questionElement = document.querySelector(`[data-name="${firstNewQuestionName}"]`);
        
        // If not found by data-name, try alternative selectors
        if (!questionElement) {
          // Try finding by question title or other attributes
          const allQuestions = document.querySelectorAll('.sv-question');
          questionElement = allQuestions[currentElements.length - addedQuestionNames.length];
        }
        
        if (questionElement) {
          // Smooth scroll to the question with some offset for better visibility
          questionElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
          
          // Add a subtle highlight animation to the newly added question(s)
          const newQuestions = addedQuestionNames.map(name => 
            document.querySelector(`[data-name="${name}"]`)
          ).filter(Boolean);
          
          newQuestions.forEach(element => {
            if (element) {
              // Add temporary highlight class
              element.style.transition = 'all 0.6s ease';
              element.style.backgroundColor = '#e8f5e8';
              element.style.border = '2px solid #28a745';
              element.style.borderRadius = '8px';
              element.style.padding = '10px';
              
              // Remove highlight after 2 seconds
              setTimeout(() => {
                element.style.backgroundColor = '';
                element.style.border = '';
                element.style.borderRadius = '';
                element.style.padding = '';
                
                // Remove transition after animation completes
                setTimeout(() => {
                  element.style.transition = '';
                }, 600);
              }, 2000);
            }
          });
        }
      }
    }, 300); // Small delay to ensure DOM is updated
    
    // DON'T change the survey key - this preserves answers
    // setSurveyKey(prev => prev + 1); // REMOVED - this was causing data loss
  }, [surveyJson]);

  const handleSurveyComplete = useCallback((answerData) => {
    console.log("=== SURVEY COMPLETED ===");
    console.log("SURVEY ANSWERS:", JSON.stringify(answerData, null, 2));
    
    // Calculate survey completion metadata
    const completionTime = new Date().toISOString();
    const totalDuration = new Date().getTime() - surveyMetadata.startBuildTime;
    
    const finalMetadata = {
      ...surveyMetadata,
      completedAt: completionTime,
      surveyBuildDuration: totalDuration,
      finalQuestionCount: surveyJson.pages[0].elements.length,
      responseCount: Object.keys(answerData).length,
      completionData: {
        userResponses: answerData,
        submissionTimestamp: completionTime,
        surveyVersion: "1.0",
        responseId: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };

    console.log("=== SURVEY METADATA (HIDDEN) ===");
    console.log("METADATA:", JSON.stringify(finalMetadata, null, 2));
    console.log("===============================");
    
    // Show results in a more user-friendly way
    let resultText = "Survey completed successfully!\n\nAnswers summary:\n";
    Object.entries(answerData).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        resultText += `${key}: ${JSON.stringify(value)}\n`;
      } else {
        resultText += `${key}: ${value}\n`;
      }
    });
    
    alert(resultText + "\nFull details logged to console.");
    
    // Reset survey AND clear stored data
    setSurveyJson(initialSurveyState);
    setSurveyData({});
    setSurveyKey(prev => prev + 1);
    
    // Reset metadata for new survey
    setSurveyMetadata({
      createdAt: new Date().toISOString(),
      lastModified: null,
      totalBundlesAdded: 0,
      bundleHistory: [],
      questionAdditionLog: [],
      surveyBuildDuration: 0,
      startBuildTime: new Date().getTime()
    });
  }, [surveyJson, surveyMetadata]);

  const clearSurvey = useCallback(() => {
    if (surveyJson.pages[0].elements.length > 0) {
      if (window.confirm("Are you sure you want to clear all questions from the survey? This will also clear all answers.")) {
        setSurveyJson(initialSurveyState);
        setSurveyData({});
        setSurveyKey(prev => prev + 1);
        
        // Reset metadata
        setSurveyMetadata({
          createdAt: new Date().toISOString(),
          lastModified: null,
          totalBundlesAdded: 0,
          bundleHistory: [],
          questionAdditionLog: [],
          surveyBuildDuration: 0,
          startBuildTime: new Date().getTime()
        });
      }
    } else {
      alert("Survey is already empty.");
    }
  }, [surveyJson]);

  // Add a callback to handle survey data changes
  const handleSurveyDataChange = useCallback((data) => {
    setSurveyData(data);
  }, []);

  const exportSurveyJson = useCallback(() => {
    // Include metadata in export (but it's still hidden from normal UI)
    const exportData = {
      survey: surveyJson,
      metadata: {
        ...surveyMetadata,
        exportedAt: new Date().toISOString(),
        exportVersion: "1.0"
      }
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "survey_export_with_metadata.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [surveyJson, surveyMetadata]);

  const questionCount = surveyJson.pages[0].elements.length;

  return (
    <div className="App">
      <header style={{ 
        textAlign: 'center', 
        padding: '20px', 
        borderBottom: '2px solid #eee',
        backgroundColor: '#eafaf1'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
          Survey Builder
        </h1>
        <p style={{ margin: '0 0 15px 0', color: '#666' }}>
          Build XLS Form compatible surveys with advanced question types and logic
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ 
            backgroundColor: '#6c757d', // Always grey
            color: '#fff', // Bright white text
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
          }}>
            {questionCount} question{questionCount !== 1 ? 's' : ''} added
          </span>
          {questionCount > 0 && (
            <>
              <button 
                onClick={clearSurvey}
                style={{
                  backgroundColor: '#6c757d', // Grey
                  color: '#fff', // Bright white
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
              >
                Clear Survey
              </button>
              <button 
                onClick={exportSurveyJson}
                style={{
                  backgroundColor: '#6c757d', // Grey
                  color: '#fff', // Bright white
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
              >
                Export JSON
              </button>
            </>
          )}
        </div>
      </header>

      <div style={{ 
        display: "flex", 
        textAlign: "left", 
        minHeight: 'calc(100vh - 200px)' 
      }}>
        <div style={{ 
          width: "35%", 
          padding: "15px", 
          backgroundColor: '#f8f9fa',
          borderRight: "2px solid #eee",
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)'
        }}>
          <QuestionPool onAddQuestions={addQuestionsToSurvey} />
        </div>
        
        <div style={{ 
          width: "65%", 
          padding: "15px",
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0 }}>Live Survey Preview</h3>
            {questionCount === 0 && (
              <span style={{ 
                color: '#666', 
                fontSize: '14px',
                fontStyle: 'italic'
              }}>
                Add questions from the left panel to start building your survey
              </span>
            )}
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            padding: questionCount > 0 ? '20px' : '40px',
            backgroundColor: questionCount > 0 ? 'white' : '#f9f9f9',
            minHeight: '400px'
          }}>
            {questionCount > 0 ? (
              <SurveyPreview 
                surveyJson={surveyJson} 
                initialData={surveyData}
                onSurveyComplete={handleSurveyComplete}
                onSurveyDataChange={handleSurveyDataChange}
                key={surveyKey}
              />
            ) : (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                color: '#999',
                height: '100%',
                minHeight: '340px',
                padding: '0 20px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.5rem', fontWeight: 500 }}>No Questions Added Yet</h4>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;