/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from '@google/genai';

import React, { useEffect, useState } from 'react';

function App() {
  const [response, setResponse] = useState('');

  useEffect(() => {
    const fetchAIResponse = async () => {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      const apiKey = 'AIzaSyBqhZ_kt-Qmsm-14406tKxDwhFdVrwsyDg'; // Replace with your actual API key
      const data = {
        contents: [
          {
            parts: [
              { text: 'Explain how AI works in a few words' }
            ]
          }
        ]
      };

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        setResponse(result.candidates[0].content.parts[0].text);
      } catch (error) {
        console.error('Error fetching AI response:', error);
        setResponse('Failed to load response');
      }
    };

    fetchAIResponse();
  }, []);

  return (
    <div>
      <h1>AI Explanation</h1>
      <p>{response}</p>
    </div>
  );
}

export default App;

const form = document.getElementById('mcq-form') as HTMLFormElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const btnText = generateBtn.querySelector('.btn-text') as HTMLSpanElement;
const spinner = generateBtn.querySelector('.spinner') as HTMLDivElement;
const resultsContainer = document.getElementById(
  'results-container',
) as HTMLElement;
const subjectInput = document.getElementById('subject') as HTMLInputElement;

// Do not use the deprecated `GoogleGenerativeAI`.
const ai = new GoogleGenAI({ apiKey: process.env.AIzaSyBqhZ_kt-Qmsm-14406tKxDwhFdVrwsyDg });

const mcqSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description: 'An array of multiple-choice questions.',
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: 'The question text.',
          },
          options: {
            type: Type.ARRAY,
            description: 'An array of 4 possible answers.',
            items: {
              type: Type.STRING,
            },
          },
          answer: {
            type: Type.STRING,
            description: 'The correct answer from the options.',
          },
        },
        required: ['question', 'options', 'answer'],
      },
    },
  },
  required: ['questions'],
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const subject = subjectInput.value.trim();
  if (!subject) {
    displayError('Please enter a subject.');
    return;
  }

  setLoading(true);
  resultsContainer.innerHTML = '';

  const prompt = `Generate 5 challenging multiple-choice questions for a competitive exam on the subject: "${subject}". Each question must have 4 options.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: mcqSchema,
      },
    });

    const jsonText = response.text.trim();
    const mcqs = JSON.parse(jsonText);

    if (!mcqs.questions || mcqs.questions.length === 0) {
      displayError('Could not generate MCQs. Please try another subject.');
      return;
    }
    
    displayMcqs(mcqs.questions);

  } catch (error) {
    console.error(error);
    displayError(
      'Failed to generate MCQs. Please check your connection and try again.',
    );
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading: boolean) {
  generateBtn.disabled = isLoading;
  if (isLoading) {
    btnText.style.display = 'none';
    spinner.style.display = 'block';
  } else {
    btnText.style.display = 'block';
    spinner.style.display = 'none';
  }
}

function displayError(message: string) {
  resultsContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

function displayMcqs(questions: any[]) {
  const fragment = document.createDocumentFragment();
  questions.forEach((mcq, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    
    const questionHeader = document.createElement('h3');
    questionHeader.textContent = `Q${index + 1}: ${mcq.question}`;
    questionCard.appendChild(questionHeader);

    const optionsList = document.createElement('div');
    optionsList.className = 'options-list';
    
    mcq.options.forEach((option: string) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'option';
      optionEl.textContent = option;
      optionsList.appendChild(optionEl);
    });
    
    questionCard.appendChild(optionsList);

    const revealContainer = document.createElement('div');
    revealContainer.className = 'reveal-container';
    
    const revealBtn = document.createElement('button');
    revealBtn.className = 'reveal-btn';
    revealBtn.textContent = 'Show Answer';

    revealBtn.addEventListener('click', () => {
        Array.from(optionsList.children).forEach((child) => {
            const optionEl = child as HTMLDivElement;
            if (optionEl.textContent === mcq.answer) {
                optionEl.classList.add('correct');
            } else {
                optionEl.classList.add('incorrect');
            }
        });
        revealBtn.style.display = 'none';
    }, { once: true });

    revealContainer.appendChild(revealBtn);
    questionCard.appendChild(revealContainer);
    fragment.appendChild(questionCard);
  });
  resultsContainer.appendChild(fragment);
}
