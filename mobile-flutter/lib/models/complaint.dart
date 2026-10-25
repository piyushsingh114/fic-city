class Complaint {
  final String id;
  final String complaintNumber;
  final String title;
  final String description;
  final String categoryName;
  final String wardName;
  final String status;
  final String priority;
  final String address;
  final String officerName;
  final int upvotesCount;
  final DateTime createdAt;
  final DateTime slaDeadline;
  final List<String> photoUrls;

  Complaint({
    required this.id,
    required this.complaintNumber,
    required this.title,
    required this.description,
    required this.categoryName,
    required this.wardName,
    required this.status,
    required this.priority,
    required this.address,
    required this.officerName,
    required this.upvotesCount,
    required this.createdAt,
    required this.slaDeadline,
    required this.photoUrls,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'] ?? '',
      complaintNumber: json['complaint_number'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      categoryName: json['category_name'] ?? 'General',
      wardName: json['ward_name'] ?? 'Delhi',
      status: json['status'] ?? 'SUBMITTED',
      priority: json['priority'] ?? 'MEDIUM',
      address: json['address'] ?? '',
      officerName: json['officer_name'] ?? 'Unassigned',
      upvotesCount: json['upvotes_count'] ?? 0,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      slaDeadline: DateTime.tryParse(json['sla_deadline'] ?? '') ?? DateTime.now(),
      photoUrls: (json['media'] as List<dynamic>?)
              ?.map((m) => m['url'].toString())
              .toList() ??
          [],
    );
  }
}
