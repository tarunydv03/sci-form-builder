// src/QuestionPool.js
import React from "react";

// Enhanced Feature Library containing all XLS form compatible question bundles
const QUESTION_BUNDLES = [
  // --- FIXED BUNDLE #1: Simple Repeating Group (Fixed Dynamic Panel) ---
  {
    id: "bundle_simple_repeat_v2",
    bundleTitle: "Repeating Group (for Children)",
    questionSchemas: [
      {
        type: "text",
        name: "children_count",
        inputType: "number",
        title: "How many children do you have?",
        isRequired: true,
        validators: [{ type: "numeric", minValue: 0, maxValue: 10, text: "Value must be between 0 and 10." }]
      },
      {
        type: "paneldynamic",
        name: "children_details",
        title: "Children Details",
        templateElements: [
          { type: "text", name: "child_name", title: "Child's Name", isRequired: true },
          { 
            type: "text", 
            name: "child_age", 
            inputType: "number", 
            title: "Child's Age", 
            isRequired: true, 
            validators: [{ type: "numeric", minValue: 0, maxValue: 17, text: "Age must be between 0 and 17." }] 
          }
        ],
        visibleIf: "{children_count} > 0",
        panelCount: 0,
        minPanelCount: 0,
        maxPanelCount: 10,
        allowAddPanel: false,
        allowRemovePanel: false,
        templateTitle: "Child #{panelIndex}"
      }
    ]
  },

  // --- FIXED BUNDLE #2: Nested Repeating Group (Improved) ---
  {
    id: "bundle_nested_repeat_v2",
    bundleTitle: "Nested Repeats (Household & Assets)",
    questionSchemas: [
      {
        type: "text",
        name: "household_size",
        inputType: "number",
        title: "How many members are in your household?",
        isRequired: true,
        validators: [{ type: "numeric", minValue: 1, maxValue: 15, text: "Household size must be between 1 and 15." }]
      },
      {
        type: "paneldynamic",
        name: "household_members",
        title: "Household Member Information",
        visibleIf: "{household_size} > 0",
        panelCount: 0,
        minPanelCount: 0,
        maxPanelCount: 15,
        allowAddPanel: false,
        allowRemovePanel: false,
        templateTitle: "Member #{panelIndex}",
        templateElements: [
          { type: "text", name: "member_name", title: "Member's Name", isRequired: true },
          { 
            type: "text", 
            name: "asset_count", 
            inputType: "number", 
            title: "How many assets does this person own?",
            validators: [{ type: "numeric", minValue: 0, maxValue: 20, text: "Asset count must be between 0 and 20." }]
          },
          {
            type: "paneldynamic",
            name: "member_assets",
            title: "Asset Details",
            visibleIf: "{panel.asset_count} > 0",
            panelCount: 0,
            maxPanelCount: 20,
            allowAddPanel: false,
            allowRemovePanel: false,
            templateTitle: "Asset #{panelIndex}",
            templateElements: [
              { type: "text", name: "asset_name", title: "Asset Name (e.g., Phone, Bicycle)", isRequired: true },
              { 
                type: "text", 
                name: "asset_value", 
                inputType: "number", 
                title: "Estimated Value (in local currency)",
                validators: [{ type: "numeric", minValue: 0, text: "Value must be positive." }]
              }
            ]
          }
        ]
      }
    ]
  },

  // --- FIXED BUNDLE #3: Choice Filter (Country/City) - Fixed Implementation ---
  {
    id: "bundle_choice_filter_v2",
    bundleTitle: "Dependent Choices (Country/City)",
    questionSchemas: [
      {
        type: "radiogroup",
        name: "country",
        title: "Please select a country:",
        choices: ["Canada", "USA", "India"],
        isRequired: true,
      },
      {
        type: "radiogroup",
        name: "city",
        title: "Please select a city:",
        visibleIf: "{country} notempty",
        choicesVisibleIf: "true",
        choices: [
          { value: "Toronto", text: "Toronto", visibleIf: "{country} = 'Canada'" },
          { value: "Vancouver", text: "Vancouver", visibleIf: "{country} = 'Canada'" },
          { value: "New York", text: "New York", visibleIf: "{country} = 'USA'" },
          { value: "Boston", text: "Boston", visibleIf: "{country} = 'USA'" },
          { value: "Delhi", text: "Delhi", visibleIf: "{country} = 'India'" },
          { value: "Mumbai", text: "Mumbai", visibleIf: "{country} = 'India'" }
        ]
      }
    ]
  },

  // --- NEW BUNDLE #4: Advanced Skip Logic Group ---
  {
    id: "bundle_skip_logic_v1",
    bundleTitle: "Skip Logic Group (Employment)",
    questionSchemas: [
      {
        type: "radiogroup",
        name: "employment_status",
        title: "What is your employment status?",
        choices: ["Employed", "Self-Employed", "Unemployed", "Student", "Retired"],
        isRequired: true
      },
      {
        type: "text",
        name: "company_name",
        title: "What is the name of your company?",
        visibleIf: "{employment_status} = 'Employed'",
        isRequired: true
      },
      {
        type: "text",
        name: "business_type",
        title: "What type of business do you run?",
        visibleIf: "{employment_status} = 'Self-Employed'",
        isRequired: true
      },
      {
        type: "radiogroup",
        name: "job_seeking",
        title: "Are you actively looking for a job?",
        choices: ["Yes", "No"],
        visibleIf: "{employment_status} = 'Unemployed'",
        isRequired: true
      },
      {
        type: "text",
        name: "field_of_study",
        title: "What is your field of study?",
        visibleIf: "{employment_status} = 'Student'",
        isRequired: true
      },
      {
        type: "text",
        name: "retirement_year",
        inputType: "number",
        title: "What year did you retire?",
        visibleIf: "{employment_status} = 'Retired'",
        validators: [{ type: "numeric", minValue: 1950, maxValue: 2025 }]
      }
    ]
  },

  // --- NEW BUNDLE #5: Media Upload Bundle ---
  {
    id: "bundle_media_upload_v1",
    bundleTitle: "Media Upload (Image, Audio, Document)",
    questionSchemas: [
      {
        type: "file",
        name: "profile_photo",
        title: "Upload your profile photo (Image)",
        acceptedTypes: "image/*",
        storeDataAsText: false,
        maxSize: 2097152, // 2MB in bytes
        allowMultiple: false,
        isRequired: false
      },
      {
        type: "file",
        name: "voice_recording",
        title: "Upload a voice recording (Audio)",
        acceptedTypes: "audio/*",
        storeDataAsText: false,
        maxSize: 10485760, // 10MB in bytes
        allowMultiple: false,
        isRequired: false
      },
      {
        type: "file",
        name: "identity_document",
        title: "Upload identity document (PDF/Image)",
        acceptedTypes: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
        storeDataAsText: false,
        maxSize: 5242880, // 5MB in bytes
        allowMultiple: false,
        isRequired: false
      }
    ]
  },

  // --- NEW BUNDLE #6: Constraint Questions ---
  {
    id: "bundle_constraints_v1",
    bundleTitle: "Constraint Questions (Age, Income)",
    questionSchemas: [
      {
        type: "text",
        name: "participant_age",
        inputType: "number",
        title: "Enter your age (must be 18-65)",
        isRequired: true,
        validators: [
          { 
            type: "numeric", 
            minValue: 18, 
            maxValue: 65, 
            text: "Age must be between 18 and 65 years." 
          }
        ]
      },
      {
        type: "text",
        name: "monthly_income",
        inputType: "number",
        title: "Monthly income (minimum $1000)",
        isRequired: true,
        validators: [
          { 
            type: "numeric", 
            minValue: 1000, 
            text: "Monthly income must be at least $1000." 
          }
        ]
      },
      {
        type: "text",
        name: "phone_number",
        title: "Enter your phone number (10 digits)",
        isRequired: true,
        validators: [
          { 
            type: "regex", 
            regex: "^[0-9]{10}$", 
            text: "Phone number must be exactly 10 digits." 
          }
        ]
      }
    ]
  },

  // --- NEW BUNDLE #7: Grouping Questions ---
  {
    id: "bundle_grouped_questions_v1",
    bundleTitle: "Grouped Questions (Personal Info)",
    questionSchemas: [
      {
        type: "panel",
        name: "personal_info_group",
        title: "Personal Information",
        elements: [
          {
            type: "text",
            name: "first_name",
            title: "First Name",
            isRequired: true
          },
          {
            type: "text",
            name: "last_name", 
            title: "Last Name",
            isRequired: true
          },
          {
            type: "text",
            name: "date_of_birth",
            inputType: "date",
            title: "Date of Birth",
            isRequired: true
          }
        ]
      },
      {
        type: "panel",
        name: "contact_info_group",
        title: "Contact Information",
        elements: [
          {
            type: "text",
            name: "email_contact",
            inputType: "email",
            title: "Email Address",
            isRequired: true
          },
          {
            type: "text",
            name: "phone_contact",
            title: "Phone Number",
            isRequired: true
          },
          {
            type: "text",
            name: "address",
            title: "Home Address",
            isRequired: false
          }
        ]
      }
    ]
  },

  // --- NEW BUNDLE #8: Range and Scale Questions ---
  {
    id: "bundle_range_scale_v1",
    bundleTitle: "Range & Scale Questions",
    questionSchemas: [
      {
        type: "rating",
        name: "service_satisfaction",
        title: "Rate our service (1-10)",
        rateMin: 1,
        rateMax: 10,
        rateStep: 1,
        minRateDescription: "Very Poor",
        maxRateDescription: "Excellent",
        isRequired: true
      },
      {
        type: "rating",
        name: "likelihood_recommend",
        title: "How likely are you to recommend us? (0-10)",
        rateMin: 0,
        rateMax: 10,
        rateStep: 1,
        minRateDescription: "Not at all likely",
        maxRateDescription: "Extremely likely"
      },
      {
        type: "rating",
        name: "price_rating",
        title: "Rate our pricing (1-5 stars)",
        rateMin: 1,
        rateMax: 5,
        rateStep: 1,
        displayMode: "stars"
      }
    ]
  },

  // --- NEW BUNDLE #9: Multiple Selection with Logic ---
  {
    id: "bundle_multiple_select_logic_v1",
    bundleTitle: "Multiple Selection with Follow-up Logic",
    questionSchemas: [
      {
        type: "checkbox",
        name: "preferred_features",
        title: "Which features are most important to you? (Select all that apply)",
        choices: ["Fast Delivery", "Low Price", "Quality", "Customer Support", "Easy Returns"],
        isRequired: true
      },
      {
        type: "text",
        name: "delivery_preference",
        title: "What is your preferred delivery time?",
        visibleIf: "{preferred_features} contains 'Fast Delivery'",
        choices: ["Same Day", "Next Day", "2-3 Days", "Within a Week"]
      },
      {
        type: "text",
        name: "support_channel",
        title: "How do you prefer to contact customer support?",
        visibleIf: "{preferred_features} contains 'Customer Support'",
        choices: ["Phone", "Email", "Live Chat", "In-Person"]
      }
    ]
  },

  // --- NEW BUNDLE #10: Calculate and Expression Fields ---
  {
    id: "bundle_calculations_v1",
    bundleTitle: "Calculations (Auto-computed Fields)",
    questionSchemas: [
      {
        type: "text",
        name: "product_price",
        inputType: "number",
        title: "Enter product price ($)",
        isRequired: true,
        validators: [{ type: "numeric", minValue: 0 }]
      },
      {
        type: "text",
        name: "quantity",
        inputType: "number", 
        title: "Enter quantity",
        isRequired: true,
        validators: [{ type: "numeric", minValue: 1 }]
      },
      {
        type: "expression",
        name: "subtotal",
        title: "Subtotal",
        expression: "{product_price} * {quantity}",
        displayStyle: "currency"
      },
      {
        type: "expression",
        name: "tax",
        title: "Tax (8%)",
        expression: "{subtotal} * 0.08",
        displayStyle: "currency"
      },
      {
        type: "expression",
        name: "total",
        title: "Total Amount",
        expression: "{subtotal} + {tax}",
        displayStyle: "currency"
      }
    ]
  },

  // --- EXISTING BUNDLE #11: Email Logic Block ---
  {
    id: "bundle_email_v1",
    bundleTitle: "Email Logic Block (Yes/No with Follow-up)",
    questionSchemas: [
      {
        type: "radiogroup",
        name: "has_email",
        title: "Do you have an email address?",
        choices: ["Yes", "No"],
        isRequired: true
      },
      {
        type: "text",
        name: "email_address",
        title: "Please enter your email address.",
        inputType: "email",
        isRequired: true,
        visibleIf: "{has_email} = 'Yes'"
      }
    ]
  },

  // --- EXISTING BUNDLE #12: Age Question ---
  {
    id: "bundle_age_v1",
    bundleTitle: "Age Question (with validation)",
    questionSchemas: [{
      type: "text",
      name: "age",
      title: "What is your age? (Must be 18 or older)",
      inputType: "number",
      isRequired: true,
      validators: [{ type: "numeric", minValue: 18, text: "You must be at least 18 years old." }],
    }],
  },

  // --- EXISTING BUNDLE #13: Multiple Choice ---
  {
    id: "bundle_equipment_v1",
    bundleTitle: "Multiple Choice Question",
    questionSchemas: [{
      type: "checkbox",
      name: "equipment",
      title: "What office equipment do you use?",
      choices: ["Laptop", "External Monitor", "Printer", "Other"],
    }],
  },

  // --- EXISTING BUNDLE #14: Image Upload ---
  {
    id: "bundle_photo_id_v1",
    bundleTitle: "Simple Image Upload Question",
    questionSchemas: [{
      type: "file",
      name: "photo_id",
      title: "Please upload a picture of your photo ID.",
      acceptedTypes: "image/*",
      storeDataAsText: false,
      maxSize: 2097152, // 2MB in bytes
      allowMultiple: false,
    }],
  },

  // --- EXISTING BUNDLE #15: Range/Slider ---
  {
    id: "bundle_satisfaction_v1",
    bundleTitle: "Rating Scale (Slider)",
    questionSchemas: [{
      type: "rating",
      name: "satisfaction_score",
      title: "On a scale of 1 to 10, how satisfied are you?",
      rateMin: 1,
      rateMax: 10,
    }],
  },

  // --- EXISTING BUNDLE #16: Rank Question ---
  {
    id: "bundle_ranking_v1",
    bundleTitle: "Ranking Question",
    questionSchemas: [{
      type: "ranking",
      name: "priority_ranking",
      title: "Please rank these features in order of importance.",
      choices: ["Price", "Customer Support", "Ease of Use"],
    }],
  },

  // --- NEW BUNDLE #17: Default Values Bundle ---
  {
    id: "bundle_defaults_v1",
    bundleTitle: "Questions with Default Values",
    questionSchemas: [
      {
        type: "text",
        name: "country_of_residence",
        title: "What is your country of residence?",
        defaultValue: "Canada"
      },
      {
        type: "text",
        name: "survey_date",
        inputType: "date",
        title: "Survey Date",
        defaultValue: "today()"
      },
      {
        type: "radiogroup",
        name: "preferred_language",
        title: "Preferred Language",
        choices: ["English", "Spanish", "French", "Other"],
        defaultValue: "English"
      }
    ]
  },

  // --- NEW BUNDLE #18: Matrix Questions ---
  {
    id: "bundle_matrix_v1",
    bundleTitle: "Matrix Questions (Rating Grid)",
    questionSchemas: [{
      type: "matrix",
      name: "service_ratings",
      title: "Please rate the following aspects of our service:",
      columns: [
        { value: "excellent", text: "Excellent" },
        { value: "good", text: "Good" },
        { value: "fair", text: "Fair" },
        { value: "poor", text: "Poor" }
      ],
      rows: [
        { value: "speed", text: "Speed of Service" },
        { value: "quality", text: "Quality" },
        { value: "friendliness", text: "Staff Friendliness" },
        { value: "value", text: "Value for Money" }
      ],
      isRequired: true
    }]
  }
];

export function QuestionPool({ onAddQuestions }) {
  return (
    <div>
      <h3>XLS Form Feature Pool</h3>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
        Choose from {QUESTION_BUNDLES.length} XLS Form compatible question bundles
      </p>
      {QUESTION_BUNDLES.map((bundle) => (
        <div key={bundle.id} style={{ 
          border: "1px solid #ddd", 
          padding: "10px", 
          margin: "5px", 
          borderRadius: '5px',
          backgroundColor: '#f9f9f9'
        }}>
          <p style={{ 
            margin: '0 0 8px 0', 
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            {bundle.bundleTitle}
          </p>
          <button 
            onClick={() => onAddQuestions(bundle.questionSchemas)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Add to Survey
          </button>
        </div>
      ))}
    </div>
  );
}