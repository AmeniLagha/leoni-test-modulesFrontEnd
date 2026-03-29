// chatbot.component.ts
import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  isHtml?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chatbot-container">
      <!-- Bouton pour ouvrir/fermer -->
      <button class="chatbot-toggle" (click)="toggleChat()">
        <i class="bi bi-chat-dots-fill"></i>
      </button>

      <!-- Fenêtre de chat -->
      <div class="chat-window" *ngIf="isOpen">
        <div class="chat-header">
          <h5><i class="bi bi-robot me-2"></i>Assistant IA LEONI</h5>
          <button class="btn-close" (click)="closeChat()"></button>
        </div>

        <div class="chat-messages" #messagesContainer>
          <div *ngFor="let msg of messages"
               class="message"
               [class.user-message]="msg.isUser"
               [class.bot-message]="!msg.isUser">
            <div class="message-content">
              <!-- Afficher le contenu avec innerHTML si c'est du HTML -->
              <div *ngIf="!msg.isUser && msg.isHtml" class="message-text" [innerHTML]="sanitizeHtml(msg.text)"></div>
              <div *ngIf="msg.isUser || !msg.isHtml" class="message-text">{{ msg.text }}</div>
              <div class="message-time">{{ msg.timestamp | date:'HH:mm' }}</div>
            </div>
          </div>
          <div *ngIf="isLoading" class="message bot-message">
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <input type="text"
                 [(ngModel)]="userInput"
                 (keyup.enter)="sendMessage()"
                 placeholder="Posez votre question..."
                 [disabled]="isLoading">
          <button (click)="sendMessage()" [disabled]="!userInput || isLoading">
            <i class="bi bi-send"></i>
          </button>
        </div>

        <div class="chat-suggestions">
          <button *ngFor="let suggestion of suggestions"
                  (click)="askSuggestion(suggestion)"
                  class="suggestion-btn">
            {{ suggestion }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }

    .chatbot-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3c72 0%, #0f2b4a 100%);
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: transform 0.3s;
    }

    .chatbot-toggle:hover {
      transform: scale(1.1);
    }

    .chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 450px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chat-header {
      background: linear-gradient(135deg, #1e3c72 0%, #0f2b4a 100%);
      color: white;
      padding: 12px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-header h5 {
      margin: 0;
    }

    .chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background: #f8fafc;
    }

    .message {
      margin-bottom: 12px;
      display: flex;
    }

    .user-message {
      justify-content: flex-end;
    }

    .message-content {
      max-width: 85%;
      padding: 8px 12px;
      border-radius: 12px;
    }

    .user-message .message-content {
      background: linear-gradient(135deg, #1e3c72 0%, #0f2b4a 100%);
      color: white;
    }

    .bot-message .message-content {
      background: white;
      color: #1e293b;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .message-time {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 4px;
      text-align: right;
    }

    .message-text {
      word-wrap: break-word;
    }

    /* Styles pour les visualisations */
    .viz-response h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
    }

    .viz-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 13px;
    }

    .viz-table th,
    .viz-table td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .viz-table th {
      background: #f1f5f9;
      font-weight: 600;
    }

    .viz-total {
      background: #f8fafc;
      font-weight: bold;
    }

    .viz-image {
      margin-top: 10px;
      text-align: center;
    }

    .viz-image img {
      max-width: 100%;
      border-radius: 8px;
    }

    .chat-input {
      display: flex;
      padding: 12px;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .chat-input input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      outline: none;
    }

    .chat-input input:focus {
      border-color: #1e3c72;
    }

    .chat-input button {
      width: 36px;
      height: 36px;
      margin-left: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3c72 0%, #0f2b4a 100%);
      color: white;
      border: none;
      cursor: pointer;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #94a3b8;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }

    .chat-suggestions {
      padding: 8px 12px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .suggestion-btn {
      padding: 4px 10px;
      background: #f1f5f9;
      border: none;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .suggestion-btn:hover {
      background: #e2e8f0;
      transform: translateY(-1px);
    }

    /* Scrollbar personnalisée */
    .chat-messages::-webkit-scrollbar {
      width: 6px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .chat-messages::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: Message[] = [];

  suggestions = [
    'cahiers par projet',
    'statistiques',
    'camembert des statuts',
    'réclamations critiques'
  ];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    // Message de bienvenue
    this.messages.push({
      text: 'Bonjour ! Je suis l\'assistant IA LEONI. Je peux vous aider avec les statistiques, les cahiers des charges, la conformité, et même générer des graphiques ! Posez votre question.',
      isUser: false,
      timestamp: new Date(),
      isHtml: false
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(1, html) || '';
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    // Ajouter le message de l'utilisateur
    this.messages.push({
      text: this.userInput,
      isUser: true,
      timestamp: new Date(),
      isHtml: false
    });

    const question = this.userInput;
    this.userInput = '';
    this.isLoading = true;

    // Envoyer la question au backend
    this.http.post<{ response: string }>('http://localhost:5000/ask', {
      question: question,
      token: this.getToken()
    }).subscribe({
      next: (res) => {
        // Détecter si la réponse contient du HTML
        const isHtml = res.response.includes('<div') || res.response.includes('<table') || res.response.includes('<img');

        this.messages.push({
          text: res.response,
          isUser: false,
          timestamp: new Date(),
          isHtml: isHtml
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chatbot:', err);
        this.messages.push({
          text: 'Désolé, une erreur est survenue. Veuillez réessayer plus tard.',
          isUser: false,
          timestamp: new Date(),
          isHtml: false
        });
        this.isLoading = false;
      }
    });
  }

  getToken(): string {
    // Récupérer le token depuis le localStorage ou le service d'authentification
    return localStorage.getItem('token') || '';
  }

  askSuggestion(suggestion: string): void {
    this.userInput = suggestion;
    this.sendMessage();
  }

  scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
