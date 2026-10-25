import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final _inputController = TextEditingController();
  final List<Map<String, String>> _messages = [
    {
      'sender': 'BOT',
      'text':
          'Hello! I am your Fic City Assistant. You can speak or write to report garbage, potholes, dark streetlights, or track your existing complaint.'
    }
  ];
  bool _isLoading = false;

  Future<void> _sendMessage([String? textToSend]) async {
    final text = textToSend ?? _inputController.text;
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add({'sender': 'USER', 'text': text});
      _isLoading = true;
    });
    _inputController.clear();

    try {
      final res = await http.post(
        Uri.parse('http://10.0.2.2:5000/api/chatbot/message'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'message': text}),
      );

      if (res.statusCode == 200) {
        final data = json.decode(res.body)['data'];
        setState(() {
          _messages.add({'sender': 'BOT', 'text': data['text'] ?? ''});
        });
      }
    } catch (e) {
      setState(() {
        _messages.add({
          'sender': 'BOT',
          'text': 'Sorry, unable to connect to municipal AI server.'
        });
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fic City Assistant'),
        backgroundColor: const Color(0xFF047857),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, i) {
                final isUser = _messages[i]['sender'] == 'USER';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isUser ? const Color(0xFF059669) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: isUser ? null : Border.all(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      _messages[i]['text']!,
                      style: TextStyle(
                        color: isUser ? Colors.white : Colors.black87,
                        fontSize: 13,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Text(
                'Fic City AI is thinking...',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ),
          Container(
            padding: const EdgeInsets.all(8),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    decoration: const InputDecoration(
                      hintText: 'Type issue or complaint ID...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 16),
                    ),
                    onSubmitted: (t) => _sendMessage(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFF059669)),
                  onPressed: () => _sendMessage(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
