import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/complaint.dart';

class ApiService {
  // Use 10.0.2.2 for Android emulator, localhost for iOS simulator or web
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  static Future<List<Complaint>> getComplaints({String? status}) async {
    final uri = Uri.parse('$baseUrl/complaints${status != null ? '?status=$status' : ''}');
    final res = await http.get(uri);
    if (res.statusCode == 200) {
      final data = json.decode(res.body)['data'] as List;
      return data.map((json) => Complaint.fromJson(json)).toList();
    }
    throw Exception('Failed to load complaints');
  }

  static Future<Complaint> getComplaintById(String id) async {
    final res = await http.get(Uri.parse('$baseUrl/complaints/$id'));
    if (res.statusCode == 200) {
      return Complaint.fromJson(json.decode(res.body)['data']);
    }
    throw Exception('Complaint not found');
  }

  static Future<Complaint> createComplaint({
    required String categoryId,
    required String title,
    required String description,
    required String address,
    required double latitude,
    required double longitude,
    required bool isAnonymous,
    List<String> photos = const [],
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/complaints'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'category_id': categoryId,
        'title': title,
        'description': description,
        'address': address,
        'latitude': latitude,
        'longitude': longitude,
        'is_anonymous': isAnonymous,
        'media': photos
            .map((url) => {
                  'stage': 'BEFORE',
                  'type': 'PHOTO',
                  'url': url,
                })
            .toList(),
      }),
    );
    if (res.statusCode == 201) {
      return Complaint.fromJson(json.decode(res.body)['data']);
    }
    throw Exception('Failed to submit complaint');
  }

  static Future<void> upvote(String id) async {
    await http.post(Uri.parse('$baseUrl/complaints/$id/upvote'));
  }

  static Future<void> submitFeedback(String id, int rating, String review) async {
    await http.post(
      Uri.parse('$baseUrl/complaints/$id/feedback'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'rating': rating, 'review': review}),
    );
  }

  static Future<void> updateStatus(
    String id,
    String status,
    String remarks, {
    String? proofUrl,
  }) async {
    await http.post(
      Uri.parse('$baseUrl/complaints/$id/status'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'status': status,
        'remarks': remarks,
        'proof_media_url': proofUrl,
      }),
    );
  }
}
