import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class RaiseComplaintScreen extends StatefulWidget {
  const RaiseComplaintScreen({super.key});

  @override
  State<RaiseComplaintScreen> createState() => _RaiseComplaintScreenState();
}

class _RaiseComplaintScreenState extends State<RaiseComplaintScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _addressController =
      TextEditingController(text: 'Karol Bagh, DB Gupta Road, New Delhi');
  String _selectedCategory = 'cat-1';
  bool _isAnonymous = false;
  bool _isSubmitting = false;

  final List<Map<String, String>> _categories = [
    {'id': 'cat-1', 'name': 'Garbage & Sanitation'},
    {'id': 'cat-2', 'name': 'Pothole & Road Damage'},
    {'id': 'cat-3', 'name': 'Streetlight & Poles'},
    {'id': 'cat-4', 'name': 'Drainage & Sewage'},
    {'id': 'cat-5', 'name': 'Water Logging'},
    {'id': 'cat-6', 'name': 'Stray Animals'},
  ];

  Future<void> _submitComplaint() async {
    if (_titleController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an issue title')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final res = await http.post(
        Uri.parse('http://10.0.2.2:5000/api/complaints'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'category_id': _selectedCategory,
          'title': _titleController.text,
          'description': _descController.text,
          'address': _addressController.text,
          'is_anonymous': _isAnonymous,
          'latitude': 28.6514,
          'longitude': 77.1907,
        }),
      );

      if (res.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Complaint filed successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Raise Civic Complaint')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<String>(
            value: _selectedCategory,
            decoration: const InputDecoration(
              labelText: 'Category',
              border: OutlineInputBorder(),
            ),
            items: _categories
                .map((c) => DropdownMenuItem(
                      value: c['id'],
                      child: Text(c['name']!),
                    ))
                .toList(),
            onChanged: (val) => setState(() => _selectedCategory = val!),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Title / Short Problem Name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _descController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Detailed Description',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _addressController,
            decoration: const InputDecoration(
              labelText: 'Location / Landmark',
              border: OutlineInputBorder(),
              suffixIcon: Icon(Icons.my_location),
            ),
          ),
          const SizedBox(height: 16),
          CheckboxListTile(
            title: const Text('Submit Anonymously'),
            subtitle: const Text('Do not reveal my phone number publicly'),
            value: _isAnonymous,
            onChanged: (val) => setState(() => _isAnonymous = val ?? false),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _submitComplaint,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF047857),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              textStyle: const TextStyle(fontWeight: FontWeight.bold),
            ),
            child: _isSubmitting
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text('Submit Complaint (MCD 311)'),
          ),
        ],
      ),
    );
  }
}
