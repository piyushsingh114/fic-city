import 'package:flutter/material.dart';
import '../models/complaint.dart';
import '../services/api_service.dart';

class ComplaintDetailsScreen extends StatefulWidget {
  final Complaint complaint;

  const ComplaintDetailsScreen({super.key, required this.complaint});

  @override
  State<ComplaintDetailsScreen> createState() => _ComplaintDetailsScreenState();
}

class _ComplaintDetailsScreenState extends State<ComplaintDetailsScreen> {
  late Complaint _complaint;
  int _userRating = 5;
  final _reviewController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _complaint = widget.complaint;
  }

  void _giveFeedback() async {
    await ApiService.submitFeedback(_complaint.id, _userRating, _reviewController.text);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Thank you! Feedback recorded.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_complaint.complaintNumber),
        backgroundColor: const Color(0xFF047857),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Text(
                        _complaint.categoryName,
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
                      ),
                      Chip(
                        label: Text(_complaint.status,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        backgroundColor: _complaint.status == 'RESOLVED'
                            ? Colors.green.shade100
                            : Colors.amber.shade100,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _complaint.title,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(_complaint.description, style: const TextStyle(color: Colors.black87)),
                  const Divider(height: 24),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 16, color: Colors.red),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(_complaint.address, style: const TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.person, size: 16, color: Colors.blue),
                      const SizedBox(width: 4),
                      Text('Officer: ${_complaint.officerName}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),
          const Text(
            'Evidence Photos (Before & After)',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),

          // Photo Gallery
          if (_complaint.photoUrls.isNotEmpty)
            SizedBox(
              height: 140,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _complaint.photoUrls.length,
                itemBuilder: (ctx, idx) => Container(
                  margin: const EdgeInsets.only(right: 12),
                  width: 140,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    image: DecorationImage(
                      image: NetworkImage(_complaint.photoUrls[idx]),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
            )
          else
            Container(
              height: 100,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Text('No photo evidence available'),
            ),

          const SizedBox(height: 24),

          // Feedback Section (if resolved)
          if (_complaint.status == 'RESOLVED')
            Card(
              color: Colors.green.shade50,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Rate Municipal Resolution:',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    Row(
                      children: List.generate(
                        5,
                        (index) => IconButton(
                          icon: Icon(
                            index < _userRating ? Icons.star : Icons.star_border,
                            color: Colors.amber,
                          ),
                          onPressed: () => setState(() => _userRating = index + 1),
                        ),
                      ),
                    ),
                    TextField(
                      controller: _reviewController,
                      decoration: const InputDecoration(
                        hintText: 'Share your feedback review...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: _giveFeedback,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF047857),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Submit Rating'),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
